import React from 'react';
import './BookmarkModal.css';

const BookmarkModal = ({ isOpen, onClose, onSave, defaultName = '' }) => {
  const [locationName, setLocationName] = React.useState(defaultName);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(locationName);
    setLocationName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Add Bookmark</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={locationName}
            onChange={(e) => setLocationName(e.target.value)}
            placeholder="Enter location name"
            autoFocus
          />
          <div className="modal-buttons">
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
            <button type="submit" className="save-button">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookmarkModal;