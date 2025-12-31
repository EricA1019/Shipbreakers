// Save manager utilities for exporting and importing game saves

export function exportSave(filename: string = 'shipbreakers-save.json') {
  const storeState = localStorage.getItem('ship-breakers-store');
  if (!storeState) {
    alert('No save data to export!');
    return;
  }

  try {
    const data = JSON.stringify(JSON.parse(storeState), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export save:', error);
    alert('Failed to export save file');
  }
}

export function importSave(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        // Validate basic structure
        if (!data.state || typeof data.state !== 'object') {
          throw new Error('Invalid save file format');
        }
        
        // Save to localStorage
        localStorage.setItem('ship-breakers-store', JSON.stringify(data));
        
        // Reload page to apply new state
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
        resolve(true);
      } catch (error) {
        console.error('Failed to import save:', error);
        alert('Failed to import save file. Make sure it\'s a valid Ship Breakers save.');
        resolve(false);
      }
    };
    reader.onerror = () => {
      alert('Failed to read file');
      resolve(false);
    };
    reader.readAsText(file);
  });
}
