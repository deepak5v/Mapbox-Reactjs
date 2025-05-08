import React from 'react';
import './BookmarkList.css';

const BookmarkList = ({ bookmarks, onBookmarkClick, onDeleteBookmark }) => {
  if (!bookmarks.length) {
    return <div className="no-bookmarks">No saved locations</div>;
  }

  return (
    <div className="bookmarks-list">
      {bookmarks.map(bookmark => (
        <div key={bookmark.id} className="bookmark-item">
          <button
            className="bookmark-name"
            onClick={() => onBookmarkClick(bookmark)}
          >
            ⭐ {bookmark.name}
          </button>
          <button
            className="delete-bookmark"
            onClick={() => onDeleteBookmark(bookmark.id)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default BookmarkList;