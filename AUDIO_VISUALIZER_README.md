# Real-Time Audio Visualizer

A modern, interactive audio visualization component built with Next.js, TypeScript, and the Web Audio API. This application provides real-time audio visualization with both waveform and spectrum analyzer views.

## Features

### 🎵 Audio Input Methods
- **File Upload**: Support for various audio formats (MP3, WAV, OGG, etc.)
- **Microphone Recording**: Real-time audio recording with microphone access
- **Audio Playback**: Full playback controls with play, pause, stop functionality

### 📊 Visualization Types
- **Waveform View**: Real-time amplitude visualization showing audio waveform
- **Spectrum Analyzer**: Frequency domain visualization with animated bars
- **Smooth Animations**: 60fps real-time rendering using requestAnimationFrame

### 🎛️ Audio Controls
- **Volume Control**: Adjustable volume slider with percentage display
- **Progress Tracking**: Real-time progress bar with time display
- **Playback Controls**: Intuitive play, pause, and stop buttons
- **Recording Controls**: Start and stop recording functionality

### 🎨 Modern UI
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Theme**: Professional dark interface optimized for audio visualization
- **Tailwind CSS**: Modern styling with smooth transitions and hover effects
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Technical Implementation

### Web Audio API Integration
- **AudioContext**: Manages audio processing and analysis
- **AnalyserNode**: Provides real-time frequency and time-domain data
- **MediaElementSource**: Connects HTML audio elements to the audio graph
- **getUserMedia**: Enables microphone access for recording

### Canvas Rendering
- **High Performance**: Direct canvas manipulation for smooth animations
- **Customizable**: Configurable colors, dimensions, and bar properties
- **Real-time Updates**: Continuous data flow from audio analysis to visualization

### React Architecture
- **TypeScript**: Full type safety and better development experience
- **Hooks**: Modern React patterns with useCallback, useEffect, and useRef
- **Component Composition**: Modular design with reusable components
- **State Management**: Efficient state updates and prop passing

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser with Web Audio API support

### Installation
```bash
# Navigate to the project directory
cd my-app

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage
1. **Access the Application**: Open `http://localhost:3000` in your browser
2. **Navigate to Audio Visualizer**: Click the "🎵 Audio Visualizer" button on the homepage
3. **Upload or Record Audio**: 
   - Upload an audio file using the file input
   - Or record audio using your microphone
4. **Choose Visualization**: Switch between Waveform and Spectrum views
5. **Control Playback**: Use the play, pause, stop buttons and volume slider
6. **Watch the Visualization**: See real-time audio analysis in action

## Browser Compatibility

### Supported Browsers
- Chrome 66+
- Firefox 60+
- Safari 14+
- Edge 79+

### Required APIs
- Web Audio API
- MediaDevices API (for recording)
- Canvas API
- requestAnimationFrame

## File Structure

```
my-app/
├── app/
│   ├── components/
│   │   ├── AudioVisualizer.tsx    # Main visualization component
│   │   └── AudioControls.tsx      # Audio input and control component
│   ├── audio-visualizer/
│   │   └── page.tsx               # Audio visualizer page
│   ├── page.tsx                   # Homepage with navigation
│   └── layout.tsx                 # Root layout
├── package.json
└── tsconfig.json
```

## Customization

### Visualizer Properties
The `AudioVisualizer` component accepts various props for customization:

```typescript
<AudioVisualizer
  width={800}                    // Canvas width
  height={300}                   // Canvas height
  barWidth={6}                   // Spectrum bar width
  barGap={3}                     // Gap between bars
  barColor="#00ff88"             // Primary color
  backgroundColor="#1a1a1a"      // Background color
  visualizationType="spectrum"   // "waveform" or "spectrum"
/>
```

### Audio Analysis Settings
The analyzer node can be configured for different visualization effects:

```typescript
analyser.fftSize = 2048;                    // Frequency resolution
analyser.smoothingTimeConstant = 0.8;       // Smoothing factor
```

## Performance Considerations

### Optimization Techniques
- **requestAnimationFrame**: Smooth 60fps animations
- **useCallback**: Prevents unnecessary re-renders
- **Canvas Optimization**: Efficient drawing algorithms
- **Memory Management**: Proper cleanup of audio contexts and streams

### Best Practices
- Resume suspended AudioContext on user interaction
- Clean up MediaRecorder streams when stopping
- Handle browser compatibility gracefully
- Provide fallbacks for unsupported features

## Troubleshooting

### Common Issues

**Audio Context Suspended**
- Solution: Ensure user interaction before starting audio
- The app automatically resumes context on play

**Microphone Access Denied**
- Solution: Allow microphone permissions in browser settings
- Check if HTTPS is required for getUserMedia

**No Audio Output**
- Solution: Check system volume and browser audio settings
- Ensure audio file format is supported

**Visualization Not Updating**
- Solution: Check if audio is actually playing
- Verify AudioContext and AnalyserNode are properly connected

## Future Enhancements

### Planned Features
- **Multiple Audio Sources**: Support for multiple simultaneous audio inputs
- **Advanced Visualizations**: 3D visualizations and particle effects
- **Audio Effects**: Real-time audio processing and effects
- **Export Functionality**: Save visualizations as images or videos
- **Presets**: Pre-configured visualization styles and themes

### Technical Improvements
- **Web Workers**: Offload audio processing to background threads
- **WebGL Rendering**: Hardware-accelerated visualization rendering
- **Audio Worklets**: Custom audio processing nodes
- **PWA Support**: Progressive Web App capabilities

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Web Audio API specification and documentation
- Next.js team for the excellent framework
- Tailwind CSS for the utility-first styling approach
- React team for the component-based architecture 