import React, { useState, useEffect, useRef } from 'react';
import { Mic, Upload, Youtube, Play, Square, RefreshCw, Settings, X, Trash2, AlertCircle, FileText, Github } from 'lucide-react';
import { transcribeAudio, validateApiKey } from './api/transcribe';
import { validateYoutubeUrl, createYoutubeErrorMessage, downloadYoutubeAudio } from './api/youtube';
import { TermsOfUse } from './components/TermsOfUse';

function App() {
  const [recording, setRecording] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [processingYoutube, setProcessingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string>('');

  useEffect(() => {
    const savedApiKey = localStorage.getItem('geminiApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    } else {
      setShowSettings(true);
    }
  }, []);

  useEffect(() => {
    if (recording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [recording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRecord = async () => {
    if (!recording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          chunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudio(audioUrl);

          const fileName = `recording_${new Date().toISOString()}.wav`;
          const audioFile = new File([audioBlob], fileName, { type: 'audio/wav' });
          setSelectedFile(audioFile);

          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Error accessing microphone. Please ensure you have granted permission.');
      }
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        setRecording(false);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setRecordedAudio(URL.createObjectURL(file));
    }
  };

  const handleYoutubeSubmit = async () => {
    setYoutubeError('');
    if (!youtubeUrl.trim()) {
      setYoutubeError('Please enter a YouTube URL');
      return;
    }

    setProcessingYoutube(true);
    try {
      const isValid = await validateYoutubeUrl(youtubeUrl);
      if (!isValid) {
        setYoutubeError(createYoutubeErrorMessage(youtubeUrl));
        return;
      }

      const audioFile = await downloadYoutubeAudio(youtubeUrl);
      setSelectedFile(audioFile);
      setRecordedAudio(URL.createObjectURL(audioFile));
      setYoutubeUrl('');
    } catch (error) {
      setYoutubeError(error instanceof Error ? error.message : 'Failed to process YouTube video');
    } finally {
      setProcessingYoutube(false);
    }
  };

  const handleTranscribe = async () => {
    if (!apiKey) {
      alert('Please set your Google API key in settings first.');
      setShowSettings(true);
      return;
    }

    if (!selectedFile) {
      alert('Please record audio or upload a file first.');
      return;
    }

    setLoading(true);
    try {
      const result = await transcribeAudio(selectedFile, apiKey);
      setTranscription(result);
    } catch (error) {
      console.error('Transcription error:', error);
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setLoading(true);
    try {
      const isValid = await validateApiKey(apiKey);
      if (isValid) {
        localStorage.setItem('geminiApiKey', apiKey.trim());
        setShowSettings(false);
        alert('API key saved successfully!');
      } else {
        alert('Invalid API key. Please check and try again.');
      }
    } catch (error) {
      console.error('API key validation error:', error);
      alert('Error validating API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecording = () => {
    if (recordedAudio) {
      URL.revokeObjectURL(recordedAudio);
    }
    setRecordedAudio(null);
    setSelectedFile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1">
        <header className="text-center mb-12 relative">
          <button
            onClick={() => setShowSettings(true)}
            className="absolute right-4 top-0 p-2 rounded-full hover:bg-gray-700/50 transition-colors"
            title="Settings"
          >
            <Settings size={24} />
          </button>
          <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Audio Transcription AI
          </h1>
          <p className="text-gray-400">Convert your audio to text with advanced AI technology</p>
        </header>

        {showSettings && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-xl w-full max-w-md relative">
              <button
                onClick={() => setShowSettings(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X size={24} />
              </button>
              <h2 className="text-xl font-semibold mb-4">API Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Google Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Enter your API key"
                  />
                </div>
                <button
                  onClick={handleSaveApiKey}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 py-2 rounded-lg font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Validating...
                    </>
                  ) : (
                    'Save Settings'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700">
            <div className="text-center">
              <button
                onClick={handleRecord}
                className={`p-4 rounded-full ${
                  recording 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } transition-all duration-300`}
              >
                {recording ? <Square size={24} /> : <Mic size={24} />}
              </button>
              <p className="mt-4 text-gray-300">
                {recording ? `Recording... ${formatTime(recordingTime)}` : 'Start Recording'}
              </p>
              {recordedAudio && (
                <div className="mt-4 space-y-2">
                  <audio src={recordedAudio} controls className="w-full" />
                  <button
                    onClick={handleDeleteRecording}
                    className="text-red-400 hover:text-red-300 flex items-center gap-2 mx-auto"
                  >
                    <Trash2 size={16} />
                    Delete Recording
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700">
            <div className="text-center">
              <label className="cursor-pointer">
                <div className="p-4 rounded-full bg-purple-500 hover:bg-purple-600 inline-block transition-all duration-300">
                  <Upload size={24} />
                </div>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <p className="mt-4 text-gray-300">
                {selectedFile ? selectedFile.name : 'Upload Audio File'}
              </p>
            </div>
          </div>

          <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700">
            <div className="text-center">
              <div className="p-4 rounded-full bg-red-500 hover:bg-red-600 inline-block transition-all duration-300">
                <Youtube size={24} />
              </div>
              <div className="mt-4 space-y-2">
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="Enter YouTube URL"
                  className="w-full bg-gray-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-white"
                />
                {youtubeError && (
                  <div className="text-red-400 text-sm flex items-center gap-1">
                    <AlertCircle size={16} />
                    {youtubeError}
                  </div>
                )}
                <button
                  onClick={handleYoutubeSubmit}
                  disabled={processingYoutube || !youtubeUrl.trim()}
                  className="w-full bg-red-500 hover:bg-red-600 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processingYoutube ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    'Process YouTube Video'
                  )}
                </button>
                <p className="text-xs text-gray-400">
                  Note: If you see YouTube-related errors in the console, they are caused by ad blockers and won't affect functionality.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleTranscribe}
            disabled={loading || !selectedFile}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <Play size={20} />
            )}
            Transcribe
          </button>
        </div>

        {transcription && (
          <div className="bg-gray-800/50 p-6 rounded-xl backdrop-blur-sm border border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Transcription Result</h2>
            <div className="bg-gray-900/50 p-4 rounded-lg">
              <p className="text-gray-300 whitespace-pre-wrap">{transcription}</p>
            </div>
          </div>
        )}
      </div>

      {showTerms && <TermsOfUse onClose={() => setShowTerms(false)} />}

      <footer className="bg-gray-800/50 border-t border-gray-700 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTerms(true)}
              className="text-gray-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <FileText size={20} />
              Terms of Use
            </button>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <span>Powered by</span>
            <a
              href="https://github.com/ScParis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition-colors"
            >
              <Github size={20} />
              ScParis
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;