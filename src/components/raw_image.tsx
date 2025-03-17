import React, { useState, useEffect, useRef } from 'react';

const RawImageViewer = () => {
  const [imageData, setImageData] = useState(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [colorDepth, setColorDepth] = useState(8);
  const [colorChannels, setColorChannels] = useState(1); 
  const [headerSize, setHeaderSize] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("normal"); // "normal" or "heatmap"
  const [heatmapIntensity, setHeatmapIntensity] = useState(1);
  const canvasRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setError("");
    try {
      const arrayBuffer = await file.arrayBuffer();
      setImageData(arrayBuffer);
    } catch (err) {
      setError("Failed to read the file: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Color mapping function for heatmap mode
  const getHeatmapColor = (value) => {
    // Normalize value between 0-1
    const normalizedValue = value / 255;
    const intensity = Math.min(1, normalizedValue * heatmapIntensity);
    
    // Create a heatmap gradient (blue -> cyan -> green -> yellow -> red)
    let r, g, b;
    
    if (intensity < 0.25) {
      // Blue to Cyan (0.0 - 0.25)
      const t = intensity / 0.25;
      r = 0;
      g = Math.round(255 * t);
      b = 255;
    } else if (intensity < 0.5) {
      // Cyan to Green (0.25 - 0.5)
      const t = (intensity - 0.25) / 0.25;
      r = 0;
      g = 255;
      b = Math.round(255 * (1 - t));
    } else if (intensity < 0.75) {
      // Green to Yellow (0.5 - 0.75)
      const t = (intensity - 0.5) / 0.25;
      r = Math.round(255 * t);
      g = 255;
      b = 0;
    } else {
      // Yellow to Red (0.75 - 1.0)
      const t = (intensity - 0.75) / 0.25;
      r = 255;
      g = Math.round(255 * (1 - t));
      b = 0;
    }
    
    return { r, g, b };
  };

  const renderImage = () => {
    if (!imageData || !canvasRef.current || dimensions.width <= 0 || dimensions.height <= 0) return;

    const canvas = canvasRef.current;
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx = canvas.getContext('2d');
    const imageWidth = dimensions.width;
    const imageHeight = dimensions.height;
    const imageDataObj = ctx.createImageData(imageWidth, imageHeight);
    const rawData = new Uint8Array(imageData);
    const dataOffset = headerSize;
    const bytesPerChannel = colorDepth === 8 ? 1 : 2;
    const bytesPerPixel = bytesPerChannel * colorChannels;
    
    for (let y = 0; y < imageHeight; y++) {
      for (let x = 0; x < imageWidth; x++) {
        const pixelIndex = (y * imageWidth + x) * 4; 
        const rawPixelIndex = dataOffset + (y * imageWidth + x) * bytesPerPixel;
        
        if (rawPixelIndex + bytesPerPixel > rawData.length) continue;
        
        let r = 0, g = 0, b = 0;
        let pixelValue = 0;
        
        if (colorChannels === 1) {
          // Grayscale
          pixelValue = bytesPerChannel === 1 ? 
            rawData[rawPixelIndex] : 
            (rawData[rawPixelIndex] + (rawData[rawPixelIndex + 1] << 8)) * 255 / 65535;
            
          r = g = b = pixelValue;
        } else {
          // RGB(A)
          if (bytesPerChannel === 1) {
            r = rawData[rawPixelIndex];
            g = rawData[rawPixelIndex + 1];
            b = rawData[rawPixelIndex + 2];
          } else {
            r = (rawData[rawPixelIndex] + (rawData[rawPixelIndex + 1] << 8)) * 255 / 65535;
            g = (rawData[rawPixelIndex + 2] + (rawData[rawPixelIndex + 3] << 8)) * 255 / 65535;
            b = (rawData[rawPixelIndex + 4] + (rawData[rawPixelIndex + 5] << 8)) * 255 / 65535;
          }
          pixelValue = (r + g + b) / 3; // Average for heatmap
        }
        
        if (viewMode === "heatmap") {
          // Apply heatmap coloring
          const heatColor = getHeatmapColor(pixelValue);
          r = heatColor.r;
          g = heatColor.g;
          b = heatColor.b;
        }
        
        imageDataObj.data[pixelIndex] = r;
        imageDataObj.data[pixelIndex + 1] = g;
        imageDataObj.data[pixelIndex + 2] = b;
        imageDataObj.data[pixelIndex + 3] = 255; // Alpha channel (opaque)
      }
    }
    
    ctx.putImageData(imageDataObj, 0, 0);
  };

  useEffect(() => {
    renderImage();
  }, [imageData, dimensions, colorDepth, colorChannels, headerSize, viewMode, heatmapIntensity]);

  const handleRightClick = (event) => {
    event.preventDefault();
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const dataURL = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataURL;
      link.download = "147_150_40_150_141_162_160_55_154_141_142_57_155_160_151_55_164_165_164_157_162_151_141_154.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-200 p-6 rounded-lg shadow-lg text-black">
      <h1 className="text-2xl font-bold mb-4">RAW Image Viewer</h1>
      
      <div className="mb-6 w-full">
        <div className="flex flex-col mb-4">
          <label className="mb-1 font-medium">Upload RAW Image File:</label>
          <input 
            type="file" 
            accept=".raw,.data,.bin"
            onChange={handleFileUpload}
            className="border p-2 rounded"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-1 font-medium text-black">Image Width:</label>
            <input 
              type="number" 
              min="1" 
              className="border p-2 rounded w-full text-black" 
              value={dimensions.width}
              onChange={(e) => setDimensions({...dimensions, width: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-black">Image Height:</label>
            <input 
              type="number" 
              min="1" 
              className="border p-2 rounded w-full text-black" 
              value={dimensions.height}
              onChange={(e) => setDimensions({...dimensions, height: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium">Color Depth (bits):</label>
            <select 
              className="border p-2 rounded w-full text-black"
              value={colorDepth}
              onChange={(e) => setColorDepth(parseInt(e.target.value))}
            >
              <option value="8">8-bit</option>
              <option value="16">16-bit</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-black">Color Channels:</label>
            <select 
              className="border p-2 rounded w-full text-black"
              value={colorChannels}
              onChange={(e) => setColorChannels(parseInt(e.target.value))}
            >
              <option value="1">Grayscale (1 channel)</option>
              <option value="3">RGB (3 channels)</option>
              <option value="4">RGBA (4 channels)</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-black">Header Size (bytes to skip):</label>
            <input 
              type="number" 
              min="0" 
              className="border p-2 rounded w-full text-black" 
              value={headerSize}
              onChange={(e) => setHeaderSize(parseInt(e.target.value) || 0)}
            />
          </div>
          
          <div>
            <label className="block mb-1 font-medium text-black">View Mode:</label>
            <select 
              className="border p-2 rounded w-full text-black"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="normal">Normal</option>
              <option value="heatmap">Heatmap</option>
            </select>
          </div>
          
          {viewMode === "heatmap" && (
            <div>
              <label className="block mb-1 font-medium text-black">Heatmap Intensity:</label>
              <input 
                type="range" 
                min="0.1" 
                max="3" 
                step="0.1"
                className="w-full" 
                value={heatmapIntensity}
                onChange={(e) => setHeatmapIntensity(parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-xs">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          )}
        </div>
        
        <button 
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-medium"
          onClick={renderImage}
          disabled={!imageData || dimensions.width <= 0 || dimensions.height <= 0}
        >
          Render Image
        </button>
      </div>
      
      {loading && <p className="text-black">Loading file...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      <p className='text-sm text-gray-500'>Right click on the image below to save locally</p>
      <div className="mt-4 border rounded p-2 bg-white">
        {imageData ? (
          <div className="overflow-auto">
            <canvas 
              ref={canvasRef} 
              className="max-w-full"
              style={{ maxHeight: '1000px' }}
              onContextMenu={handleRightClick}
            />
          </div>
        ) : (
          <div className="p-8 text-center text-black">
            Upload a RAW image file to view it here
          </div>
        )}
      </div>
      
      {viewMode === "heatmap" && (
        <div className="mt-2 flex items-center">
          <div className="w-full h-6 rounded overflow-hidden flex">
            <div className="h-full w-1/4" style={{background: "linear-gradient(to right, #0000FF, #00FFFF)"}}></div>
            <div className="h-full w-1/4" style={{background: "linear-gradient(to right, #00FFFF, #00FF00)"}}></div>
            <div className="h-full w-1/4" style={{background: "linear-gradient(to right, #00FF00, #FFFF00)"}}></div>
            <div className="h-full w-1/4" style={{background: "linear-gradient(to right, #FFFF00, #FF0000)"}}></div>
          </div>
          {/* <div className="flex justify-between w-full text-xs mt-1">
            <span>Low</span>
            <span>High</span>
          </div> */}
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-600">
        <p>⚠️ <strong>Note:</strong> You need to specify the correct dimensions, color depth, 
        and channel count to properly view the RAW image. These parameters depend on 
        how the RAW file was created.</p>
      </div>
      <div className='mt-4 text-sm text-gray-600'>
        <p>&copy; <a className='underline' href="https://uabacm.org/" target='_blank'>ACM at UAB</a> & <a className='underline' href='https://michaelgathara.com/' target='_black'>Michael Gathara</a> | Open Sourced: <a className='underline' href="https://github.com/UABACM/raw_image" target='_blank'>Github</a></p>
      </div>
    </div>
  );
};

export default RawImageViewer;