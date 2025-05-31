document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const uploadButton = document.getElementById('upload-button');
    const previewContainer = document.getElementById('preview-container');

    uploadButton.addEventListener('click', () => {
        const files = fileInput.files;
        previewContainer.innerHTML = '';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (function(file) {
                return function(e) {
                    const div = document.createElement('div');
                    div.classList.add('file-preview');

                    if (file.type.startsWith('image/')) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.alt = file.name;
                        div.appendChild(img);
                    } else {
                        const p = document.createElement('p');
                        p.textContent = `Uploaded file: ${file.name}`;
                        div.appendChild(p);
                    }

                    previewContainer.appendChild(div);
                };
            })(file);

            reader.readAsDataURL(file);
        }
    });

    document.getElementById('uploadForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const files = document.getElementById('fileInput').files;
        const previewContainer = document.getElementById('filePreview');
        
        for(let file of files) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            // Create icon/preview container
            const iconContainer = document.createElement('div');
            
            if (file.type.startsWith('image/')) {
                // For images, create an actual preview
                const img = document.createElement('img');
                img.className = 'image-preview';
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    img.src = e.target.result;
                }
                
                reader.readAsDataURL(file);
                iconContainer.appendChild(img);
            } else if (file.type === 'application/pdf') {
                // For PDFs, show PDF icon
                iconContainer.className = 'file-icon pdf-icon';
            } else {
                // For other files, show generic file icon
                iconContainer.className = 'file-icon';
                iconContainer.style.backgroundImage = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 384 512\'><path fill=\'gray\' d=\'M224 136V0H24C10.7 0 0 10.7 0 24v464c0 13.3 10.7 24 24 24h336c13.3 0 24-10.7 24-24V160H248c-13.2 0-24-10.8-24-24zm160-14.1v6.1H256V0h6.1c6.4 0 12.5 2.5 17 7l97.9 98c4.5 4.5 7 10.6 7 16.9z\'/></svg>")';
            }
            
            // Add filename below icon
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = file.name;
            
            fileItem.appendChild(iconContainer);
            fileItem.appendChild(fileName);
            previewContainer.appendChild(fileItem);
        }
        
        // Clear the file input
        document.getElementById('fileInput').value = '';
    });
});