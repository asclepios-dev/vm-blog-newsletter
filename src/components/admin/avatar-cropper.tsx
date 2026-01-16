'use client'

import React, { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { useField, useAuth } from '@payloadcms/ui'

interface AvatarCropperProps {
  path: string
  field: {
    name: string
    label?: string
    required?: boolean
  }
}

interface UserWithFirstName {
  id: string
  email: string
  firstName?: string
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.crossOrigin = 'anonymous'
    image.src = url
  })

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  )

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Canvas is empty'))
        }
      },
      'image/jpeg',
      0.9,
    )
  })
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({ path }) => {
  const { value, setValue } = useField<string>({ path })
  const { user } = useAuth<UserWithFirstName>()
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string)
        setIsModalOpen(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const uploadCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsUploading(true)
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)
      const altText = user?.firstName ? `${user.firstName}'s avatar` : 'User avatar'

      const formData = new FormData()
      formData.append('file', croppedBlob, 'avatar.jpg')
      formData.append('_payload', JSON.stringify({ alt: altText }))

      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setValue(data.doc.id)
        setPreviewUrl(data.doc.url)
        setIsModalOpen(false)
        setImageSrc(null)
      } else {
        const errorData = await response.json()
        console.error('Upload failed:', errorData)
      }
    } catch (error) {
      console.error('Error uploading avatar:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const removeAvatar = () => {
    setValue(null)
    setPreviewUrl(null)
  }

  // Load existing avatar preview
  React.useEffect(() => {
    if (value && !previewUrl) {
      fetch(`/api/media/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.url) {
            setPreviewUrl(data.url)
          }
        })
        .catch(console.error)
    }
  }, [value, previewUrl])

  return (
    <div className="avatar-cropper">
      <style>{`
        .avatar-cropper {
          margin-bottom: 1rem;
        }
        .avatar-cropper__label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }
        .avatar-cropper__preview {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--theme-elevation-150);
          margin-bottom: 0.5rem;
        }
        .avatar-cropper__placeholder {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--theme-elevation-100);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          color: var(--theme-elevation-400);
          font-size: 2rem;
        }
        .avatar-cropper__buttons {
          display: flex;
          gap: 0.5rem;
        }
        .avatar-cropper__button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
        }
        .avatar-cropper__button--primary {
          background: var(--theme-elevation-500);
          color: white;
        }
        .avatar-cropper__button--secondary {
          background: var(--theme-elevation-150);
          color: var(--theme-elevation-800);
        }
        .avatar-cropper__modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
        }
        .avatar-cropper__modal-content {
          background: var(--theme-elevation-0);
          padding: 1.5rem;
          border-radius: 8px;
          width: 90%;
          max-width: 500px;
        }
        .avatar-cropper__crop-container {
          position: relative;
          width: 100%;
          height: 300px;
          background: var(--theme-elevation-50);
          border-radius: 4px;
          overflow: hidden;
        }
        .avatar-cropper__controls {
          margin-top: 1rem;
        }
        .avatar-cropper__slider-label {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 0.875rem;
        }
        .avatar-cropper__slider {
          width: 100%;
          margin-bottom: 1rem;
        }
        .avatar-cropper__modal-buttons {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          margin-top: 1rem;
        }
      `}</style>

      <label className="avatar-cropper__label">Avatar</label>

      {previewUrl ? (
        <img src={previewUrl} alt="Avatar" className="avatar-cropper__preview" />
      ) : (
        <div className="avatar-cropper__placeholder">?</div>
      )}

      <div className="avatar-cropper__buttons">
        <label className="avatar-cropper__button avatar-cropper__button--primary">
          {value ? 'Change' : 'Upload'}
          <input type="file" accept="image/*" onChange={onFileChange} style={{ display: 'none' }} />
        </label>
        {value && (
          <button
            type="button"
            className="avatar-cropper__button avatar-cropper__button--secondary"
            onClick={removeAvatar}
          >
            Remove
          </button>
        )}
      </div>

      {isModalOpen && imageSrc && (
        <div className="avatar-cropper__modal">
          <div className="avatar-cropper__modal-content">
            <h3 style={{ marginBottom: '1rem' }}>Crop Avatar</h3>
            <div className="avatar-cropper__crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="avatar-cropper__controls">
              <label className="avatar-cropper__slider-label">Zoom</label>
              <input
                type="range"
                className="avatar-cropper__slider"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                aria-label="Zoom"
              />
            </div>
            <div className="avatar-cropper__modal-buttons">
              <button
                type="button"
                className="avatar-cropper__button avatar-cropper__button--secondary"
                onClick={() => {
                  setIsModalOpen(false)
                  setImageSrc(null)
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="avatar-cropper__button avatar-cropper__button--primary"
                onClick={uploadCroppedImage}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AvatarCropper
