// src/utils/cloudinary.js

export const uploadImageToCloudinary = async (file, onProgress) => {
  const cloudName   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

  const formData = new FormData()
  formData.append('file',         file)
  formData.append('upload_preset', uploadPreset)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText).secure_url)
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror  = () => reject(new Error('Upload failed: network error'))
    xhr.onabort  = () => reject(new Error('Upload cancelled'))
    xhr.send(formData)
  })
}

export const getCloudinaryThumbnail = (url, width = 400, height = 300) => {
  if (!url || !url.includes('cloudinary.com')) return url || ''
  return url.replace(
    '/upload/',
    `/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`
  )
}
