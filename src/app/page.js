export default function Home() {
  function readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();

      reader.onload = function (e) {};

      reader.readAsDataURL(input.files[0]);
    } else {
      removeUpload();
    }
  }

  function removeUpload() {}

  return (
    <div className="file-upload">
      <button
        className="file-upload-btn"
        type="button"
        onclick="$('.file-upload-input').trigger( 'click' )"
      >
        Add Image
      </button>

      <div className="image-upload-wrap">
        <input
          className="file-upload-input"
          type="file"
          onchange="readURL(this);"
          accept="image/*"
        />
        <div className="drag-text">
          <h3>Drag and drop a file or select add Image</h3>
        </div>
      </div>
      <div className="file-upload-content">
        <img className="file-upload-image" src="#" alt="your image" />
        <div className="image-title-wrap">
          <button
            type="button"
            onclick="removeUpload()"
            className="remove-image"
          >
            Remove <span className="image-title">Uploaded Image</span>
          </button>
        </div>
      </div>
    </div>
  );
}
