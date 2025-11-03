"use client"

import React from 'react'
import { FileUpload as FileUploadInput } from './ui/file-upload'

const FileUpload: React.FC = () => {

  const handleFileUpload  = async (files: File[])  => {
    const file = files[0] // first file se le rahe hai
    console.log(file)
    if (!file) return;

    const formData = new FormData()
    console.log(formData)
    const appendedData = formData.append('file', file); // file ke naam se append hoga
    console.log(appendedData)

    try {
      // API route ko call karo
      const response = await fetch('http://localhost:8080/uploads/pdf', {
        method: 'POST',
        body: formData  // formdata direct bhej do - content type header 
      })
      console.log(response)

      const data = await response.json()

      if (response.ok)  {
        console.log("upload sucess", data)
      }
      else {
        console.log("upload failed", data.error)
      }
    } catch (error) {
      console.log("error uploading file", error)
    }
  }


  return (
    <div>
        <FileUploadInput onChange={handleFileUpload} />
    </div>
  )
}

export default FileUpload