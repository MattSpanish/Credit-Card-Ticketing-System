// src/KnowledgeBasePage.jsx
import React, { useState, useMemo, useEffect, useRef } from 'react';
import './knowledgeBase.css';
import {
  getStoredKnowledgeBaseItems,
  saveKnowledgeBaseItemsList,
  sortKnowledgeBaseItemsAZ,
  DEFAULT_KB_ITEMS,
  OFFICIAL_KB_CATEGORIES,
  getStoredCustomTags,
  saveStoredCustomTags,
  getStoredDeletedTags,
  saveStoredDeletedTags,
} from './knowledgeBaseStorage';
import {
  fetchKnowledgeBase,
  addKnowledgeBaseGuide,
  updateKnowledgeBaseGuide,
  deleteKnowledgeBaseGuide,
  purgeExampleGuides,
} from './supabaseKnowledgeBase';

function isHtmlContent(str) {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}

function htmlToPlainText(html) {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.innerText || tmp.textContent || '';
}

function compressAndFormatImage(file, callback) {
  if (!file || !file.type || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      const MAX_WIDTH = 1280;
      const MAX_HEIGHT = 1280;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        if (width / height > MAX_WIDTH / MAX_HEIGHT) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        } else {
          width = Math.round((width * MAX_HEIGHT) / height);
          height = MAX_HEIGHT;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);
      callback(compressedUrl);
    };
    img.onerror = () => {
      callback(dataUrl);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// Helper to ensure an image is always Behind Text and freely movable
function formatImageAsBehindText(img, defaultLeft = 24, defaultTop = 40) {
  if (!img) return;
  img.dataset.wrapping = 'behind';
  img.style.position = 'absolute';
  img.style.zIndex = '0';
  img.style.cursor = 'move';
  img.style.opacity = '0.92';
  if (!img.style.left) {
    img.style.left = `${defaultLeft}px`;
  }
  if (!img.style.top) {
    img.style.top = `${defaultTop}px`;
  }
  img.style.maxWidth = 'none';
}

function KbRichEditor({
  value,
  onChange,
  placeholder = '',
}) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const [selectedImg, setSelectedImg] = useState(null);
  const [imgBox, setImgBox] = useState(null);
  const isInteractingRef = useRef(false);

  // Update selected image overlay coordinates relative to editor container
  const updateOverlay = () => {
    if (!selectedImg || !containerRef.current) {
      setImgBox(null);
      return;
    }
    const containerRect = containerRef.current.getBoundingClientRect();
    const imgRect = selectedImg.getBoundingClientRect();

    setImgBox({
      top: imgRect.top - containerRect.top,
      left: imgRect.left - containerRect.left,
      width: imgRect.width,
      height: imgRect.height,
    });
  };

  useEffect(() => {
    if (!selectedImg) {
      setImgBox(null);
      return;
    }
    updateOverlay();
    const scrollContainer = containerRef.current?.querySelector('.ql-editor');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateOverlay);
    }
    window.addEventListener('resize', updateOverlay);
    return () => {
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', updateOverlay);
      }
      window.removeEventListener('resize', updateOverlay);
    };
  }, [selectedImg]);

  // Keyboard Delete / Backspace listener to delete selected image
  useEffect(() => {
    if (!selectedImg) return;

    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
        !activeEl.closest('.kb-quill-wrapper')
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        e.stopPropagation();
        handleDeleteImage();
      } else if (e.key === 'Escape') {
        setSelectedImg(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [selectedImg]);

  // Delete selected image
  const handleDeleteImage = () => {
    if (!selectedImg) return;
    const imgToRemove = selectedImg;
    setSelectedImg(null);
    setImgBox(null);
    imgToRemove.remove();
    if (quillRef.current) {
      quillRef.current.update();
      onChange(quillRef.current.root.innerHTML);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    if (typeof window.Quill === 'undefined') return;

    containerRef.current.innerHTML = '';
    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    const quill = new window.Quill(editorDiv, {
      theme: 'snow',
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image']
        ]
      }
    });

    const initAllImagesBehindText = () => {
      const imgs = editorDiv.querySelectorAll('img');
      imgs.forEach((img, idx) => {
        formatImageAsBehindText(img, 24, 40 + idx * 40);
      });
    };

    // Capture phase paste listener with ZERO duplicates & Auto Behind Text
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData || !clipboardData.items) return;

      const items = clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.startsWith('image/')) {
          e.preventDefault();
          e.stopPropagation();
          if (e.stopImmediatePropagation) e.stopImmediatePropagation();

          const file = item.getAsFile();
          if (file) {
            compressAndFormatImage(file, (compressedUrl) => {
              const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
              const bounds = quill.getBounds(range.index) || { top: 40, left: 24 };
              quill.insertEmbed(range.index, 'image', compressedUrl, window.Quill.sources.USER);
              quill.setSelection(range.index + 1, window.Quill.sources.SILENT);

              setTimeout(() => {
                const editor = containerRef.current?.querySelector('.ql-editor');
                if (!editor) return;
                const imgs = editor.querySelectorAll('img');
                const newImg = Array.from(imgs).find((im) => im.src === compressedUrl) || imgs[imgs.length - 1];
                if (newImg) {
                  formatImageAsBehindText(newImg, bounds.left || 24, bounds.top || 40);
                  setSelectedImg(newImg);
                  quill.update();
                  onChange(quill.root.innerHTML);
                }
              }, 50);
            });
          }
          return;
        }
      }
    };

    // Drag & Drop image upload with Auto Behind Text
    const handleDrop = (e) => {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type && file.type.startsWith('image/')) {
          e.preventDefault();
          e.stopPropagation();
          compressAndFormatImage(file, (compressedUrl) => {
            const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
            const bounds = quill.getBounds(range.index) || { top: 40, left: 24 };
            quill.insertEmbed(range.index, 'image', compressedUrl, window.Quill.sources.USER);
            quill.setSelection(range.index + 1, window.Quill.sources.SILENT);

            setTimeout(() => {
              const editor = containerRef.current?.querySelector('.ql-editor');
              if (!editor) return;
              const imgs = editor.querySelectorAll('img');
              const newImg = Array.from(imgs).find((im) => im.src === compressedUrl) || imgs[imgs.length - 1];
              if (newImg) {
                formatImageAsBehindText(newImg, bounds.left || 24, bounds.top || 40);
                setSelectedImg(newImg);
                quill.update();
                onChange(quill.root.innerHTML);
              }
            }, 50);
          });
        }
      }
    };

    // Click to select image (direct or underneath text)
    const handleClick = (e) => {
      if (isInteractingRef.current) return;

      if (e.target && e.target.tagName === 'IMG') {
        setSelectedImg(e.target);
        return;
      }
      if (e.target && (e.target.closest('.kb-image-resizer-overlay') || e.target.classList.contains('kb-resize-handle'))) {
        return;
      }

      // Check if clicking directly over an image that is behind text
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const imgUnderneath = elements.find((el) => el.tagName === 'IMG' && containerRef.current?.contains(el));

      if (imgUnderneath) {
        setSelectedImg(imgUnderneath);
      } else {
        setSelectedImg(null);
      }
    };

    // Toolbar image button picker
    const toolbar = quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = () => {
          if (input.files && input.files[0]) {
            const file = input.files[0];
            compressAndFormatImage(file, (compressedUrl) => {
              const range = quill.getSelection(true) || { index: quill.getLength(), length: 0 };
              const bounds = quill.getBounds(range.index) || { top: 40, left: 24 };
              quill.insertEmbed(range.index, 'image', compressedUrl, window.Quill.sources.USER);
              quill.setSelection(range.index + 1, window.Quill.sources.SILENT);

              setTimeout(() => {
                const editor = containerRef.current?.querySelector('.ql-editor');
                if (!editor) return;
                const imgs = editor.querySelectorAll('img');
                const newImg = Array.from(imgs).find((im) => im.src === compressedUrl) || imgs[imgs.length - 1];
                if (newImg) {
                  formatImageAsBehindText(newImg, bounds.left || 24, bounds.top || 40);
                  setSelectedImg(newImg);
                  quill.update();
                  onChange(quill.root.innerHTML);
                }
              }, 50);
            });
          }
        };
      });
    }

    quill.root.addEventListener('paste', handlePaste, true);
    quill.root.addEventListener('drop', handleDrop, true);
    quill.root.addEventListener('click', handleClick);

    if (value) {
      if (isHtmlContent(value)) {
        quill.root.innerHTML = value;
      } else {
        quill.root.innerHTML = value
          .split('\n')
          .map((line) => `<p>${line || '<br>'}</p>`)
          .join('');
      }
      setTimeout(initAllImagesBehindText, 50);
    }

    quill.on('text-change', () => {
      const text = quill.getText().trim();
      const html = quill.root.innerHTML;
      if (!text && (html === '<p><br></p>' || html === '<p></p>' || !html)) {
        onChange('');
      } else {
        onChange(html);
      }
    });

    quillRef.current = quill;

    return () => {
      if (quill && quill.root) {
        quill.root.removeEventListener('paste', handlePaste, true);
        quill.root.removeEventListener('drop', handleDrop, true);
        quill.root.removeEventListener('click', handleClick);
      }
      quillRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    const quill = quillRef.current;
    if (quill) {
      const currentHtml = quill.root.innerHTML;
      const text = quill.getText().trim();
      const effectiveCurrent =
        !text && (currentHtml === '<p><br></p>' || currentHtml === '<p></p>')
          ? ''
          : currentHtml;
      if (value !== effectiveCurrent) {
        if (!value) {
          quill.root.innerHTML = '';
        } else if (isHtmlContent(value)) {
          quill.root.innerHTML = value;
        } else {
          quill.root.innerHTML = value
            .split('\n')
            .map((line) => `<p>${line || '<br>'}</p>`)
            .join('');
        }
      }
    }
  }, [value]);

  // Word / Google Docs 8-Directional Drag-to-Resize Handler
  // Supports independent horizontal resizing on 'w' & 'e' handles!
  const handleResizeMouseDown = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedImg) return;

    isInteractingRef.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = selectedImg.offsetWidth;
    const startHeight = selectedImg.offsetHeight;
    const aspectRatio = startWidth / (startHeight || 1);
    const startLeft = parseFloat(selectedImg.style.left || '0') || selectedImg.offsetLeft || 0;
    const startTop = parseFloat(selectedImg.style.top || '0') || selectedImg.offsetTop || 0;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction === 'e') {
        // Horizontal Resize Right: change width only!
        newWidth = Math.max(30, startWidth + deltaX);
        newHeight = startHeight;
      } else if (direction === 'w') {
        // Horizontal Resize Left: change width and left position only!
        newWidth = Math.max(30, startWidth - deltaX);
        newHeight = startHeight;
        selectedImg.style.left = `${startLeft + deltaX}px`;
      } else if (direction === 's') {
        // Vertical Resize Bottom: change height only!
        newHeight = Math.max(30, startHeight + deltaY);
        newWidth = startWidth;
      } else if (direction === 'n') {
        // Vertical Resize Top: change height and top position only!
        newHeight = Math.max(30, startHeight - deltaY);
        newWidth = startWidth;
        selectedImg.style.top = `${startTop + deltaY}px`;
      } else if (direction === 'se') {
        // Corner Bottom-Right: proportional resize
        newWidth = Math.max(40, startWidth + deltaX);
        newHeight = Math.max(30, newWidth / aspectRatio);
      } else if (direction === 'sw') {
        // Corner Bottom-Left: proportional resize
        newWidth = Math.max(40, startWidth - deltaX);
        newHeight = Math.max(30, newWidth / aspectRatio);
        selectedImg.style.left = `${startLeft + deltaX}px`;
      } else if (direction === 'ne') {
        // Corner Top-Right: proportional resize
        newWidth = Math.max(40, startWidth + deltaX);
        newHeight = Math.max(30, newWidth / aspectRatio);
        selectedImg.style.top = `${startTop - (newHeight - startHeight)}px`;
      } else if (direction === 'nw') {
        // Corner Top-Left: proportional resize
        newWidth = Math.max(40, startWidth - deltaX);
        newHeight = Math.max(30, newWidth / aspectRatio);
        selectedImg.style.left = `${startLeft + deltaX}px`;
        selectedImg.style.top = `${startTop - (newHeight - startHeight)}px`;
      }

      selectedImg.style.width = `${Math.round(newWidth)}px`;
      selectedImg.style.height = `${Math.round(newHeight)}px`;
      selectedImg.style.maxWidth = 'none';
      selectedImg.style.maxHeight = 'none';
      updateOverlay();
    };

    const onMouseUp = () => {
      isInteractingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (quillRef.current) {
        quillRef.current.update();
        onChange(quillRef.current.root.innerHTML);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Free Move / Drag anywhere across canvas (Behind Text)
  const handleMoveMouseDown = (e) => {
    if (e.target.classList.contains('kb-resize-handle')) return;

    e.preventDefault();
    e.stopPropagation();
    isInteractingRef.current = true;

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = parseFloat(selectedImg.style.left || '0') || selectedImg.offsetLeft || 0;
    const startTop = parseFloat(selectedImg.style.top || '0') || selectedImg.offsetTop || 0;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      const newLeft = Math.max(0, startLeft + deltaX);
      const newTop = Math.max(0, startTop + deltaY);

      selectedImg.style.position = 'absolute';
      selectedImg.style.left = `${Math.round(newLeft)}px`;
      selectedImg.style.top = `${Math.round(newTop)}px`;
      updateOverlay();
    };

    const onMouseUp = () => {
      isInteractingRef.current = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      if (quillRef.current) {
        quillRef.current.update();
        onChange(quillRef.current.root.innerHTML);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  if (typeof window.Quill === 'undefined') {
    return (
      <textarea
        className="kb-form-input kb-textarea-steps"
        rows={8}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    );
  }

  return (
    <div className="kb-quill-wrapper reminder-quill-wrapper" ref={containerRef} style={{ position: 'relative' }}>
      {/* Interactive Word / Docs Style Image Resizer Overlay without floating toolbar */}
      {selectedImg && imgBox && (
        <div
          className="kb-image-resizer-overlay is-behind-mode"
          style={{
            top: imgBox.top,
            left: imgBox.left,
            width: imgBox.width,
            height: imgBox.height,
            cursor: 'move',
          }}
          onMouseDown={handleMoveMouseDown}
        >
          {/* 8-Directional Word / Google Docs Drag-to-Resize Handles */}
          {/* Corners (Proportional) */}
          <div className="kb-resize-handle kb-handle-nw" onMouseDown={(e) => handleResizeMouseDown(e, 'nw')} title="Resize Top-Left" />
          <div className="kb-resize-handle kb-handle-ne" onMouseDown={(e) => handleResizeMouseDown(e, 'ne')} title="Resize Top-Right" />
          <div className="kb-resize-handle kb-handle-se" onMouseDown={(e) => handleResizeMouseDown(e, 'se')} title="Resize Bottom-Right" />
          <div className="kb-resize-handle kb-handle-sw" onMouseDown={(e) => handleResizeMouseDown(e, 'sw')} title="Resize Bottom-Left" />

          {/* Edges (Horizontal and Vertical) */}
          <div className="kb-resize-handle kb-handle-n" onMouseDown={(e) => handleResizeMouseDown(e, 'n')} title="Resize Height (Top)" />
          <div className="kb-resize-handle kb-handle-s" onMouseDown={(e) => handleResizeMouseDown(e, 's')} title="Resize Height (Bottom)" />
          <div className="kb-resize-handle kb-handle-w" onMouseDown={(e) => handleResizeMouseDown(e, 'w')} title="Resize Horizontally (Left)" />
          <div className="kb-resize-handle kb-handle-e" onMouseDown={(e) => handleResizeMouseDown(e, 'e')} title="Resize Horizontally (Right)" />
        </div>
      )}
    </div>
  );
}

function formatKbDate(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    const formatted = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
    return formatted.replace(/^([A-Za-z]+ \d+),\s*/, '$1 ');
  } catch {
    return '';
  }
}

export default function KnowledgeBasePage({ onBackToDashboard }) {
  const [items, setItems] = useState(() => {
    return sortKnowledgeBaseItemsAZ(purgeExampleGuides());
  });

  // Supabase cloud sync (hardcoded in background)
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync guides silently from Supabase in background
  const loadGuidesFromCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchKnowledgeBase();
      if (res.success && res.items) {
        setItems(sortKnowledgeBaseItemsAZ(res.items));
      }
    } catch (err) {
      console.error('Error syncing knowledge base from cloud:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadGuidesFromCloud();
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [viewingItem, setViewingItem] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Filter dropdown state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const filterDropdownRef = useRef(null);

  // Custom tag creation state inside filter popover
  const [customTags, setCustomTags] = useState(() => getStoredCustomTags());
  const [deletedTags, setDeletedTags] = useState(() => getStoredDeletedTags());
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [newTagError, setNewTagError] = useState('');
  const [tagToDeleteConfirm, setTagToDeleteConfirm] = useState(null);
  const [activeZoomImage, setActiveZoomImage] = useState(null);

  // Close filter dropdown on outside click or Esc
  useEffect(() => {
    if (!isFilterOpen) return;
    const handleClickOutside = (e) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target)) {
        setIsFilterOpen(false);
        setTagSearchQuery('');
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeZoomImage) {
          setActiveZoomImage(null);
        } else if (tagToDeleteConfirm) {
          setTagToDeleteConfirm(null);
        } else if (isAddingTag) {
          setIsAddingTag(false);
          setNewTagInput('');
          setNewTagError('');
        } else {
          setIsFilterOpen(false);
          setTagSearchQuery('');
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFilterOpen]);

  // Form states for Add/Edit
  const [formTitle, setFormTitle] = useState('');
  const [formTags, setFormTags] = useState([]);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [isFormTagDropdownOpen, setIsFormTagDropdownOpen] = useState(false);
  const [formTagSearch, setFormTagSearch] = useState('');
  const formTagDropdownRef = useRef(null);

  // Close form tag dropdown on outside click or Esc
  useEffect(() => {
    if (!isFormTagDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (formTagDropdownRef.current && !formTagDropdownRef.current.contains(e.target)) {
        setIsFormTagDropdownOpen(false);
        setFormTagSearch('');
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsFormTagDropdownOpen(false);
        setFormTagSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isFormTagDropdownOpen]);

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg, type = 'info') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Helper to extract tags array from an item
  const getItemTags = (it) => {
    if (Array.isArray(it.tags) && it.tags.length > 0) return it.tags;
    if (it.category) {
      return it.category.split(',').map((s) => s.trim()).filter(Boolean);
    }
    return ['General'];
  };

  // Derive categories: EXACT specified order: Clover, Dejavoo, FD150, PAX, Nexgo, Buypass, TSYS, Nashville, etc. + custom tags (excluding deleted)
  const categories = useMemo(() => {
    const deletedSet = new Set(deletedTags.map((t) => t.toLowerCase()));
    const officialSet = new Set(OFFICIAL_KB_CATEGORIES.map((c) => c.toLowerCase()));
    const allCustom = [...customTags];
    items.forEach((it) => {
      const itTags = getItemTags(it);
      itTags.forEach((cat) => {
        const trimmed = (cat || '').trim();
        if (
          trimmed &&
          !deletedSet.has(trimmed.toLowerCase()) &&
          !officialSet.has(trimmed.toLowerCase()) &&
          !allCustom.some((c) => c.toLowerCase() === trimmed.toLowerCase())
        ) {
          allCustom.push(trimmed);
        }
      });
    });
    const combined = [...OFFICIAL_KB_CATEGORIES, ...allCustom];
    return combined.filter((c) => !deletedSet.has(c.toLowerCase()));
  }, [items, customTags, deletedTags]);

  const handleAddNewTag = () => {
    const trimmed = (newTagInput || '').trim();
    if (!trimmed) {
      setNewTagError('Please enter a tag name');
      return;
    }
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setNewTagError(`Tag "${trimmed}" already exists`);
      return;
    }

    // Un-delete if previously deleted
    const updatedDeleted = deletedTags.filter((t) => t.toLowerCase() !== trimmed.toLowerCase());
    if (updatedDeleted.length !== deletedTags.length) {
      setDeletedTags(updatedDeleted);
      saveStoredDeletedTags(updatedDeleted);
    }

    const updatedCustom = [...customTags.filter((t) => t.toLowerCase() !== trimmed.toLowerCase()), trimmed];
    setCustomTags(updatedCustom);
    saveStoredCustomTags(updatedCustom);
    setNewTagInput('');
    setIsAddingTag(false);
    setNewTagError('');
    if (!selectedTags.includes(trimmed)) {
      setSelectedTags((prev) => [...prev, trimmed]);
    }
    showToast(`Tag "${trimmed}" added!`, 'success');
  };

  const handleConfirmDeleteTag = () => {
    if (!tagToDeleteConfirm) return;
    const tagToDelete = tagToDeleteConfirm;

    // Track in deletedTags so default or custom tags are properly removed from list
    const updatedDeleted = Array.from(new Set([...deletedTags, tagToDelete.toLowerCase()]));
    setDeletedTags(updatedDeleted);
    saveStoredDeletedTags(updatedDeleted);

    // Remove from customTags
    const updatedCustom = customTags.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase());
    setCustomTags(updatedCustom);
    saveStoredCustomTags(updatedCustom);

    // Remove from active selected filter tags
    setSelectedTags((prev) => prev.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase()));

    // Also remove tag from any guides that have it
    const updatedItems = items.map((it) => {
      const itTags = getItemTags(it);
      if (itTags.some((t) => t.toLowerCase() === tagToDelete.toLowerCase())) {
        const filteredTags = itTags.filter((t) => t.toLowerCase() !== tagToDelete.toLowerCase());
        const finalTags = filteredTags.length > 0 ? filteredTags : ['General'];
        return {
          ...it,
          tags: finalTags,
          category: finalTags.join(', ')
        };
      }
      return it;
    });
    setItems(updatedItems);
    saveKnowledgeBaseItemsList(updatedItems);

    setTagToDeleteConfirm(null);
    showToast(`Tag "${tagToDelete}" deleted.`, 'info');
  };

  const getTagCount = (cat) => {
    return items.filter((it) =>
      getItemTags(it).some((t) => t.toLowerCase() === cat.toLowerCase())
    ).length;
  };

  const getSelectedTagsMatchedCount = () => {
    if (selectedTags.length === 0) return items.length;
    const selectedLower = selectedTags.map((t) => t.toLowerCase());
    return items.filter((it) => {
      const itemTags = getItemTags(it).map((t) => t.toLowerCase());
      return selectedLower.some((sel) => itemTags.includes(sel));
    }).length;
  };

  // Keyword search & tag filter (Always sorted A–Z)
  const filteredItems = useMemo(() => {
    let result = items;

    // Filter by multiple selected tags (OR condition: guide contains ANY of selected tags)
    if (selectedTags.length > 0) {
      const selectedLower = selectedTags.map((t) => t.toLowerCase());
      result = result.filter((it) => {
        const itemTags = getItemTags(it).map((t) => t.toLowerCase());
        return selectedLower.some((sel) => itemTags.includes(sel));
      });
    }

    // Filter by search query based on title, tags, and description content
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      const tokens = q.split(/\s+/).filter(Boolean);
      result = result.filter((it) => {
        const titleStr = (it.title || '').toLowerCase();
        const tagsStr = getItemTags(it).join(' ').toLowerCase();
        const catStr = (it.category || '').toLowerCase();
        const contentStr = (it.description || '').replace(/<[^>]*>/g, ' ').toLowerCase();
        const combined = `${titleStr} ${tagsStr} ${catStr} ${contentStr}`;

        // Every search word must appear in the title, tags, or description content
        return tokens.every((token) => combined.includes(token));
      });
    }

    return sortKnowledgeBaseItemsAZ(result);
  }, [items, selectedTags, searchQuery]);

  // Navigation within full guide view (Prev / Next)
  const currentNavIndex = viewingItem
    ? filteredItems.findIndex((it) => it.id === viewingItem.id)
    : -1;

  const handlePrevItem = () => {
    if (filteredItems.length <= 1 || currentNavIndex === -1) return;
    const prevIdx = (currentNavIndex - 1 + filteredItems.length) % filteredItems.length;
    setViewingItem(filteredItems[prevIdx]);
  };

  const handleNextItem = () => {
    if (filteredItems.length <= 1 || currentNavIndex === -1) return;
    const nextIdx = (currentNavIndex + 1) % filteredItems.length;
    setViewingItem(filteredItems[nextIdx]);
  };

  // Calculate dynamic minHeight for viewingItem so absolute images are never clipped
  const computedMinHeight = useMemo(() => {
    if (!viewingItem?.description) return 480;
    let maxBottom = 480;
    const tops = [...viewingItem.description.matchAll(/top:s*(d+)px/gi)].map((m) => parseInt(m[1], 10));
    const heights = [...viewingItem.description.matchAll(/height:s*(d+)px/gi)].map((m) => parseInt(m[1], 10));
    for (let i = 0; i < tops.length; i++) {
      const bottom = (tops[i] || 0) + (heights[i] || 320) + 80;
      if (bottom > maxBottom) maxBottom = bottom;
    }
    return maxBottom;
  }, [viewingItem]);

  // Keyboard navigation for viewing guide
  useEffect(() => {
    if (!viewingItem || isEditorOpen) return;

    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return;
      if (e.key === 'ArrowLeft') {
        handlePrevItem();
      } else if (e.key === 'ArrowRight') {
        handleNextItem();
      } else if (e.key === 'Escape') {
        setViewingItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingItem, isEditorOpen, currentNavIndex, filteredItems]);

  // Open editor for creating new guide
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormTitle('');
    setFormTags(selectedTags.length > 0 ? [...selectedTags] : []);
    setFormDescription('');
    setFormError('');
    setIsFormTagDropdownOpen(false);
    setFormTagSearch('');
    setIsEditorOpen(true);
  };

  // Open editor for modifying existing guide
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormTitle(item.title || '');
    setFormTags(getItemTags(item));
    setFormDescription(item.description || '');
    setFormError('');
    setIsFormTagDropdownOpen(false);
    setFormTagSearch('');
    setIsEditorOpen(true);
  };

  // Toggle tag selection in editor
  const handleToggleTag = (tag) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    if (formError) setFormError('');
  };

  // Save handler (Add or Update) with Supabase Cloud persistence
  const handleSaveGuide = async (e) => {
    e.preventDefault();
    const cleanTitle = formTitle.trim();
    const cleanDesc = formDescription.trim();
    const textOnly = cleanDesc.replace(/<[^>]*>/g, '').trim();

    if (!cleanTitle) {
      setFormError('Please enter a title for the troubleshooting guide.');
      return;
    }
    if (formTags.length === 0) {
      setFormError('Please select at least 1 tag.');
      return;
    }
    if (!cleanDesc || (!textOnly && isHtmlContent(cleanDesc))) {
      setFormError('Please enter a description for the troubleshooting guide.');
      return;
    }

    if (editingItem) {
      // Update existing item in cloud & locally
      const updates = {
        title: cleanTitle,
        tags: formTags,
        category: formTags.join(', ') || 'General',
        description: cleanDesc,
      };
      const res = await updateKnowledgeBaseGuide(editingItem.id, updates);
      const updatedItem = res.item || { ...editingItem, ...updates, updatedAt: new Date().toISOString() };

      const updatedList = items.map((it) => (it.id === editingItem.id ? updatedItem : it));
      const sorted = sortKnowledgeBaseItemsAZ(updatedList);
      setItems(sorted);
      if (viewingItem && viewingItem.id === editingItem.id) {
        setViewingItem(updatedItem);
      }
      showToast(`Updated "${cleanTitle}" successfully!`, 'success');
    } else {
      // Create new item in cloud & locally
      const newItem = {
        title: cleanTitle,
        tags: formTags,
        category: formTags.join(', ') || 'General',
        description: cleanDesc,
      };
      const res = await addKnowledgeBaseGuide(newItem);
      const savedItem = res.item || {
        ...newItem,
        id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = [...items, savedItem];
      const sorted = sortKnowledgeBaseItemsAZ(updatedList);
      setItems(sorted);
      showToast(`Created "${cleanTitle}" and saved to cloud!`, 'success');
    }

    setIsEditorOpen(false);
    setEditingItem(null);
  };

  // Delete handler with Supabase Cloud persistence
  const handleDeleteGuide = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}" from the Knowledge Base?`)) {
      await deleteKnowledgeBaseGuide(id);
      const remaining = items.filter((it) => it.id !== id);
      const sorted = sortKnowledgeBaseItemsAZ(remaining);
      setItems(sorted);
      if (viewingItem && viewingItem.id === id) {
        setViewingItem(null);
      }
      showToast(`Deleted "${title}"`, 'info');
    }
  };

  // Copy troubleshooting steps to clipboard
  const handleCopySteps = (item) => {
    const itemTags = getItemTags(item).join(', ');
    const descText = isHtmlContent(item.description)
      ? htmlToPlainText(item.description)
      : (item.description || '');
    const textToCopy = `📌 [KNOWLEDGE BASE] ${item.title}\nTags: ${itemTags}\n\nDescription:\n${descText}`;
    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopiedId(item.id);
        showToast('Troubleshooting steps copied to clipboard!', 'success');
        setTimeout(() => setCopiedId(null), 2000);
      })
      .catch((err) => {
        console.error('Clipboard copy failed:', err);
        showToast('Failed to copy to clipboard', 'error');
      });
  };



  return (
    <div className="kb-page-container">
      {/* Toast Banner */}
      {toastMessage && (
        <div className={`kb-toast-alert kb-toast-${toastMessage.type}`}>
          <i
            className={`bi ${
              toastMessage.type === 'success'
                ? 'bi-check-circle-fill'
                : toastMessage.type === 'error'
                ? 'bi-exclamation-triangle-fill'
                : 'bi-info-circle-fill'
            } me-2`}
          ></i>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header Section */}
      <div className="kb-header-banner">
        <div className="kb-header-left">
          <div className="header-badge-row">
            <span className="kicker-pill" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#c084fc', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
              <i className="bi bi-journal-bookmark-fill me-1" aria-hidden="true"></i> Troubleshooting Steps
            </span>
          </div>
          <h1 className="kb-main-title">KNOWLEDGE BASE</h1>

          <div className="kb-header-actions" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="announcement-back-btn kb-btn-compact"
              onClick={onBackToDashboard}
              title="Return to Ticketing Dashboard"
            >
              <i className="bi bi-arrow-left" aria-hidden="true"></i> Back to Dashboard
            </button>

            <button
              type="button"
              className="btn-add-kb-guide kb-btn-compact"
              onClick={handleOpenAdd}
              title="Create a new Knowledge Base entry"
            >
              <i className="bi bi-plus-lg me-1" aria-hidden="true"></i>
              <span>New Guide</span>
            </button>
          </div>
        </div>


      </div>

      {/* Search & Filter Header Bar */}
      <div className="kb-search-panel">
        <div className="kb-search-row">
          <div className="kb-search-input-wrapper">
            <i className="bi bi-search kb-search-icon" aria-hidden="true"></i>
            <input
              type="text"
              className="kb-search-input"
              placeholder="Search troubleshooting steps by word (e.g. EBT, Settlement, Error 99, IP)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchQuery('');
              }}
              aria-label="Search knowledge base guides"
            />
            {searchQuery && (
              <button
                type="button"
                className="kb-search-clear-btn"
                onClick={() => setSearchQuery('')}
                title="Clear search"
                aria-label="Clear search"
              >
                <i className="bi bi-x-circle-fill" aria-hidden="true"></i>
              </button>
            )}
          </div>
          {/* Clean Filter Dropdown */}
          <div className="kb-filter-dropdown-wrapper" ref={filterDropdownRef}>
            <button
              type="button"
              className={`kb-filter-dropdown-btn ${selectedTags.length > 0 ? 'active' : ''}`}
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              aria-expanded={isFilterOpen}
              aria-haspopup="true"
              title="Filter guides by tags"
            >
              <i className={`bi ${selectedTags.length > 0 ? 'bi-funnel-fill' : 'bi-funnel'} me-1`}></i>
              <span className="kb-filter-btn-label">
                {selectedTags.length === 0
                  ? 'Tag'
                  : selectedTags.length === 1
                  ? selectedTags[0]
                  : `${selectedTags.length} Tags`}
              </span>
              <span className="kb-filter-btn-count">
                {selectedTags.length <= 1
                  ? selectedTags.length === 1
                    ? getTagCount(selectedTags[0])
                    : items.length
                  : getSelectedTagsMatchedCount()}
              </span>
              {selectedTags.length > 0 ? (
                <span
                  className="kb-filter-clear-icon ms-1"
                  title="Clear tag selection"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTags([]);
                  }}
                >
                  <i className="bi bi-x"></i>
                </span>
              ) : (
                <i className={`bi ${isFilterOpen ? 'bi-chevron-up' : 'bi-chevron-down'} ms-1 kb-chevron-icon`}></i>
              )}
            </button>

            {/* Floating Dropdown Menu */}
            {isFilterOpen && (
              <div className="kb-filter-menu-popover" role="menu">
                <div className="kb-filter-menu-header">
                  <span className="kb-filter-menu-title">
                    Filter by Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
                  </span>
                  {selectedTags.length > 0 && (
                    <button
                      type="button"
                      className="kb-filter-reset-link"
                      onClick={() => setSelectedTags([])}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {categories.length > 7 && (
                  <div className="kb-filter-menu-search">
                    <i className="bi bi-search"></i>
                    <input
                      type="text"
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                    {tagSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTagSearchQuery('')}
                        className="kb-filter-menu-search-clear"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    )}
                  </div>
                )}

                <div className="kb-filter-menu-list">
                  <button
                    type="button"
                    className={`kb-filter-menu-item ${selectedTags.length === 0 ? 'selected' : ''}`}
                    onClick={() => setSelectedTags([])}
                    role="menuitem"
                  >
                    <div className="kb-filter-item-left">
                      <i className={`bi ${selectedTags.length === 0 ? 'bi-check-circle-fill' : 'bi-circle'} kb-item-icon`}></i>
                      <span className="kb-item-name">All Tags</span>
                    </div>
                    <span className="kb-item-count">{items.length}</span>
                  </button>

                  {categories
                    .filter((cat) => {
                      if (!tagSearchQuery.trim()) return true;
                      return cat.toLowerCase().includes(tagSearchQuery.trim().toLowerCase());
                    })
                    .map((cat) => {
                      const isSelected = selectedTags.includes(cat);
                      const count = getTagCount(cat);
                      return (
                        <div
                          key={cat}
                          role="button"
                          tabIndex={0}
                          className={`kb-filter-menu-item ${isSelected ? 'selected' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTags((prev) =>
                              prev.includes(cat) ? prev.filter((t) => t !== cat) : [...prev, cat]
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setSelectedTags((prev) =>
                                prev.includes(cat) ? prev.filter((t) => t !== cat) : [...prev, cat]
                              );
                            }
                          }}
                          aria-checked={isSelected}
                        >
                          <div className="kb-filter-item-left">
                            <i className={`bi ${isSelected ? 'bi-check-square-fill' : 'bi-square'} kb-item-icon`}></i>
                            <span className="kb-item-name">{cat}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span className="kb-item-count">{count}</span>
                            <button
                              type="button"
                              className="kb-tag-custom-delete-btn"
                              title={`Delete tag "${cat}"`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTagToDeleteConfirm(cat);
                              }}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>

                <div className={`kb-filter-menu-footer ${isAddingTag ? 'adding' : ''}`}>
                  {isAddingTag ? (
                    <div className="kb-filter-add-tag-box kb-filter-footer-add-box">
                      <div className="kb-filter-add-tag-input-row">
                        <input
                          type="text"
                          className="kb-filter-add-tag-input"
                          value={newTagInput}
                          onChange={(e) => {
                            setNewTagInput(e.target.value);
                            if (newTagError) setNewTagError('');
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddNewTag();
                            } else if (e.key === 'Escape') {
                              setIsAddingTag(false);
                              setNewTagInput('');
                              setNewTagError('');
                            }
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="kb-filter-add-tag-save-btn"
                          onClick={handleAddNewTag}
                          title="Save Tag"
                        >
                          <i className="bi bi-check-lg"></i>
                        </button>
                        <button
                          type="button"
                          className="kb-filter-add-tag-cancel-btn"
                          onClick={() => {
                            setIsAddingTag(false);
                            setNewTagInput('');
                            setNewTagError('');
                          }}
                          title="Cancel"
                        >
                          <i className="bi bi-dash-lg"></i>
                        </button>
                      </div>
                      {newTagError && (
                        <div className="kb-filter-add-tag-error">
                          {newTagError}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="kb-filter-menu-done-btn kb-filter-menu-add-btn"
                      onClick={() => {
                        setIsAddingTag(true);
                        setNewTagError('');
                        setNewTagInput('');
                      }}
                      title="Add a custom tag"
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Active Filter Bar (shown if tag or search active) */}
        {(selectedTags.length > 0 || searchQuery.trim()) && (
          <div className="kb-active-filters-row">
            <span className="kb-active-filters-label">TAGS:</span>
            {selectedTags.map((tag) => (
              <span key={tag} className="kb-active-tag-chip">
                {tag} ({getTagCount(tag)})
                <button
                  type="button"
                  onClick={() => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
                  title={`Remove ${tag} filter`}
                  aria-label={`Remove ${tag} filter`}
                >
                  <i className="bi bi-x"></i>
                </button>
              </span>
            ))}
            {searchQuery.trim() && (
              <span className="kb-active-tag-chip kb-active-search-chip">
                <i className="bi bi-search me-1"></i>
                "{searchQuery.trim()}"
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  title="Clear search query"
                  aria-label="Clear search query"
                >
                  <i className="bi bi-x"></i>
                </button>
              </span>
            )}
            <button
              type="button"
              className="kb-clear-all-filters-btn"
              onClick={() => {
                setSelectedTags([]);
                setSearchQuery('');
              }}
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Content: Alphabetical List of Guides */}
      <div className="kb-list-section">
        {filteredItems.length === 0 ? (
          <div className="kb-empty-state">
            <div className="kb-empty-icon">
              <i className="bi bi-search"></i>
            </div>
            <h3>No troubleshooting guides found</h3>
            <p>
              {searchQuery.trim()
                ? `No guides match your search "${searchQuery}". Try different keywords or click below to clear.`
                : 'No guides created yet. Click below to add your first troubleshooting guide.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
              {searchQuery.trim() && (
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => setSearchQuery('')}
                >
                  <i className="bi bi-x-circle me-1"></i> Clear Search
                </button>
              )}
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={handleOpenAdd}
              >
                <i className="bi bi-plus-lg me-1"></i> Add "{searchQuery.trim() || 'New Guide'}"
              </button>
            </div>
          </div>
        ) : (
          <div className="kb-cards-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="reminder-card-item kb-card-item"
                onClick={() => setViewingItem(item)}
                tabIndex={0}
                role="button"
                aria-label={`View guide: ${item.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setViewingItem(item);
                  }
                }}
              >
                <div className="reminder-card-main-info kb-card-main-info">
                  <div className="reminder-card-title-group kb-card-title-group">
                    <h4 className="reminder-card-subject kb-card-subject">
                      {item.title}
                    </h4>
                  </div>
                  {(item.updatedAt || item.createdAt) && (
                    <span className="reminder-card-date kb-card-date">
                      {formatKbDate(item.updatedAt || item.createdAt)}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL 1: VIEW FULL GUIDE DETAIL */}
      {viewingItem && (
        <div
          className="break-modal-overlay"
          onClick={() => setViewingItem(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="kb-detail-title"
        >
          <div
            className="break-modal-content kb-detail-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(96vw, 1100px)', maxWidth: 1100, padding: '24px 30px' }}
          >
            {/* Guide Title Row with Delete Button & Navigation Controls on Upper Right */}
            <div className="kb-detail-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <h2 id="kb-detail-title" className="kb-detail-title" style={{ margin: 0, fontSize: '1.55rem', fontWeight: 800, wordBreak: 'break-word', flex: 1 }}>
                {viewingItem.title}
              </h2>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                <button
                  type="button"
                  className="btn-kb-action-danger"
                  onClick={() => handleDeleteGuide(viewingItem.id, viewingItem.title)}
                  title="Delete Guide"
                  style={{ margin: 0, height: 32, display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <i className="bi bi-trash3"></i> Delete
                </button>
                <div className="kb-modal-nav-controls">
                  <button
                    type="button"
                    className="feed-refresh-btn"
                    onClick={handlePrevItem}
                    disabled={filteredItems.length <= 1}
                    title="Previous guide (Left Arrow)"
                    aria-label="Previous guide"
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    type="button"
                    className="feed-refresh-btn"
                    onClick={handleNextItem}
                    disabled={filteredItems.length <= 1}
                    title="Next guide (Right Arrow)"
                    aria-label="Next guide"
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                  <button
                    type="button"
                    className="break-close-btn ms-2"
                    onClick={() => setViewingItem(null)}
                    title="Close (Esc)"
                    aria-label="Close"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>
              </div>
            </div>

            {/* Tags placed directly UNDER the title */}
            <div className="kb-detail-breadcrumbs" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
              {getItemTags(viewingItem).map((t) => (
                <span key={t} className="kb-category-pill-lg">{t}</span>
              ))}
            </div>

            {/* Description Header */}
            <div className="kb-detail-section-header" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Description
              </span>
            </div>

            {/* Full Steps Content - Clean Expansive Canvas */}
            <div className="kb-detail-body">
              {isHtmlContent(viewingItem.description) ? (
                <div
                  className="kb-steps-rich-content ql-snow ql-editor"
                  style={{ minHeight: `${computedMinHeight}px` }}
                  dangerouslySetInnerHTML={{
                    __html: (viewingItem.description || '')
                      .replace(
                        /<ol(\s+[^>]*)?>([\s\S]*?)<\/ol>/gi,
                        (match, attrs, inner) => {
                          if (inner.includes('data-list="bullet"')) {
                            return `<ul${attrs || ''}>${inner}</ul>`;
                          }
                          return match;
                        }
                      )
                      .replace(/<span class="ql-ui"[^>]*><\/span>/gi, '')
                  }}
                  onClick={(e) => {
                    if (e.target.tagName === 'IMG' && e.target.src) {
                      setActiveZoomImage(e.target.src);
                    }
                  }}
                />
              ) : (
                <div className="kb-steps-formatted">
                  {(viewingItem.description || '').split('\n').map((line, idx) => {
                    const trimmed = line.trim();
                    if (!trimmed) {
                      return <div key={idx} style={{ height: 10 }} />;
                    }
                    // Check if header step like "1. Check ...", "2. ...", "3. ..."
                    const isStepHeader = /^[0-9]+[.)]\s+/.test(trimmed);
                    // Check if bullet point
                    const isBullet = /^[•\-*]\s+/.test(trimmed);

                    if (isStepHeader) {
                      return (
                        <div key={idx} className="kb-step-row kb-step-header-row">
                          <span className="kb-step-badge">
                            {trimmed.match(/^[0-9]+/)?.[0] || '•'}
                          </span>
                          <div className="kb-step-title-text">
                            {trimmed.replace(/^[0-9]+[.)]\s*/, '')}
                          </div>
                        </div>
                      );
                    }

                    if (isBullet) {
                      return (
                        <div key={idx} className="kb-step-row kb-step-bullet-row">
                          <span className="kb-bullet-dot">•</span>
                          <div className="kb-step-content-text">
                            {trimmed.replace(/^[•\-*]\s*/, '')}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <p key={idx} className="kb-step-normal-text">
                        {line}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Footer: Edit Guide on left of Close Guide */}
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-sm btn-primary kb-btn-modal-action"
                onClick={() => handleOpenEdit(viewingItem)}
              >
                <i className="bi bi-pencil-square me-1"></i> Edit Guide
              </button>
              <button
                type="button"
                className="btn btn-sm btn-secondary kb-btn-modal-action"
                onClick={() => setViewingItem(null)}
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT GUIDE FORM */}
      {isEditorOpen && (
        <div
          className="break-modal-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="break-modal-content kb-editor-modal"
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(96vw, 1100px)', maxWidth: 1100, padding: 24 }}
          >
            <div className="break-modal-header" style={{ padding: '0 0 12px', marginBottom: 14 }}>
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <i
                    className={`bi ${editingItem ? 'bi-pencil-square' : 'bi-plus-circle-fill'}`}
                    style={{ color: '#8b5cf6' }}
                    aria-hidden="true"
                  ></i>
                  {editingItem ? 'Edit Knowledge Base Guide' : 'Add Knowledge Base Guide'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="break-close-btn"
                title="Cancel & Close"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: 16, fontSize: 13 }}>
                <i className="bi bi-exclamation-triangle-fill me-2"></i> {formError}
              </div>
            )}

            <form onSubmit={handleSaveGuide} className="kb-editor-form">
              {/* Title input */}
              <div className="form-group mb-3">
                <label className="form-label fw-bold">
                  Title <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="kb-form-input"
                  value={formTitle}
                  onChange={(e) => {
                    setFormTitle(e.target.value);
                    if (formError) setFormError('');
                  }}
                  autoFocus
                  required
                />
              </div>

              {/* Tags Selection (Modern Multi-Select Tag Input) */}
              <div className="form-group mb-3 kb-form-tag-group" ref={formTagDropdownRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label className="form-label fw-bold m-0">
                    Tags <span className="text-danger">*</span>
                  </label>
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    {formTags.length === 0 ? 'Select 1 or more tags' : `${formTags.length} tag${formTags.length > 1 ? 's' : ''} selected`}
                  </span>
                </div>

                {/* Interactive Tag Input Field Box */}
                <div
                  className={`kb-form-tag-input-box ${isFormTagDropdownOpen ? 'focused' : ''} ${formError && formTags.length === 0 ? 'is-invalid' : ''}`}
                  onClick={() => setIsFormTagDropdownOpen(!isFormTagDropdownOpen)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isFormTagDropdownOpen}
                  aria-haspopup="listbox"
                  title="Click to select tags"
                >
                  <div className="kb-form-tag-badges-container">
                    {formTags.map((tag) => (
                      <span key={tag} className="kb-form-tag-badge">
                        <i className="bi bi-tag-fill me-1"></i>
                        {tag}
                        <button
                          type="button"
                          className="kb-form-tag-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTag(tag);
                          }}
                          title={`Remove ${tag}`}
                          aria-label={`Remove ${tag}`}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="kb-form-tag-trigger-actions">
                    {formTags.length > 0 && (
                      <button
                        type="button"
                        className="kb-form-tag-add-more-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFormTagDropdownOpen(!isFormTagDropdownOpen);
                        }}
                        title="Add more tags"
                      >
                        <i className="bi bi-plus-lg me-1"></i> Add Tag
                      </button>
                    )}
                    <i className={`bi ${isFormTagDropdownOpen ? 'bi-chevron-up' : 'bi-chevron-down'} kb-form-tag-chevron`}></i>
                  </div>
                </div>

                {/* Floating Tag Selector Popover */}
                {isFormTagDropdownOpen && (
                  <div className="kb-form-tag-popover" role="dialog" onClick={(e) => e.stopPropagation()}>
                    <div className="kb-form-tag-popover-header">
                      <div className="kb-form-tag-search-box">
                        <i className="bi bi-search"></i>
                        <input
                          type="text"
                          placeholder="Search tags..."
                          value={formTagSearch}
                          onChange={(e) => setFormTagSearch(e.target.value)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        {formTagSearch && (
                          <button
                            type="button"
                            className="kb-form-tag-search-clear"
                            onClick={() => setFormTagSearch('')}
                          >
                            <i className="bi bi-x"></i>
                          </button>
                        )}
                      </div>
                      {formTags.length > 0 && (
                        <button
                          type="button"
                          className="kb-form-tag-clear-all"
                          onClick={() => {
                            setFormTags([]);
                            if (formError) setFormError('');
                          }}
                        >
                          Clear Selection
                        </button>
                      )}
                    </div>

                    <div className="kb-form-tag-options-grid">
                      {categories
                        .filter((tag) => {
                          if (!formTagSearch.trim()) return true;
                          return tag.toLowerCase().includes(formTagSearch.trim().toLowerCase());
                        })
                        .map((tag) => {
                          const isSelected = formTags.includes(tag);
                          return (
                            <button
                              key={tag}
                              type="button"
                              className={`kb-form-tag-option-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => handleToggleTag(tag)}
                              role="option"
                              aria-selected={isSelected}
                            >
                              <div className="kb-form-option-left">
                                <i className={`bi ${isSelected ? 'bi-check-square-fill kb-form-checkbox-icon-active' : 'bi-square kb-form-checkbox-icon'}`}></i>
                                <span className="kb-form-option-name">{tag}</span>
                              </div>
                              {isSelected && <i className="bi bi-check2 kb-form-check-badge"></i>}
                            </button>
                          );
                        })}
                    </div>

                    <div className="kb-form-tag-popover-footer">
                      <span className="text-muted" style={{ fontSize: 11 }}>
                        {formTags.length} of {categories.length} selected
                      </span>
                      <button
                        type="button"
                        className="kb-form-tag-done-btn"
                        onClick={() => {
                          setIsFormTagDropdownOpen(false);
                          setFormTagSearch('');
                        }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="form-group mb-4">
                <label className="form-label fw-bold mb-2">
                  Description <span className="text-danger">*</span>
                </label>
                <KbRichEditor
                  value={formDescription}
                  onChange={(val) => {
                    setFormDescription(val);
                    if (formError) setFormError('');
                  }}
                  placeholder=""
                />
              </div>

              {/* Form Action Buttons */}
              <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color, #334155)', paddingTop: 14, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary kb-btn-modal-action"
                  onClick={() => setIsEditorOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-sm btn-primary kb-btn-modal-action">
                  {editingItem ? 'Save Changes' : 'Create Guide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Tag Confirmation Modal */}
      {tagToDeleteConfirm && (
        <div
          className="break-modal-overlay kb-tag-delete-confirm-overlay"
          role="dialog"
          aria-modal="true"
        >
          <div className="kb-tag-delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="kb-tag-delete-confirm-header">
              <div className="kb-tag-delete-warning-icon">
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <h4 className="kb-tag-delete-title">Delete Tag</h4>
            </div>
            <div className="kb-tag-delete-confirm-body">
              <p>
                Are you sure you want to delete the tag{' '}
                <strong className="kb-tag-delete-name">"{tagToDeleteConfirm}"</strong>?
              </p>
              <p className="kb-tag-delete-warning-sub">
                This will remove the tag from the filter and ticket options.
              </p>
            </div>
            <div className="kb-tag-delete-confirm-actions">
              <button
                type="button"
                className="btn-kb-action-secondary"
                onClick={() => setTagToDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-kb-delete-confirm-danger"
                onClick={handleConfirmDeleteTag}
                autoFocus
              >
                <i className="bi bi-trash3 me-1"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Zoom Lightbox Modal */}
      {activeZoomImage && (
        <div
          className="break-modal-overlay kb-image-zoom-overlay"
          onClick={() => setActiveZoomImage(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="kb-image-zoom-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="kb-image-zoom-close-btn"
              onClick={() => setActiveZoomImage(null)}
              title="Close Image (Esc)"
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <img src={activeZoomImage} alt="Terminal Guide Screenshot Zoom" className="kb-image-zoom-img" />
          </div>
        </div>
      )}
    </div>
  );
}
