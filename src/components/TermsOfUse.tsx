import React from 'react';
import { X } from 'lucide-react';

interface TermsOfUseProps {
  onClose: () => void;
}

export function TermsOfUse({ onClose }: TermsOfUseProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-2xl h-[80vh] relative flex flex-col">
        <div className="p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Terms of Use</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="space-y-6 text-gray-300">
            <section>
              <h3 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h3>
              <p>By accessing and using this audio transcription service, you agree to be bound by these Terms of Use and all applicable laws and regulations.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">2. Service Description</h3>
              <p>Our service provides audio transcription capabilities through various input methods including direct recording, file upload, and YouTube video audio extraction. The service utilizes artificial intelligence for transcription.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">3. User Responsibilities</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>You must provide your own valid API key for the transcription service.</li>
                <li>You are responsible for the content you submit for transcription.</li>
                <li>You agree not to use the service for any illegal or unauthorized purpose.</li>
                <li>You must have the necessary rights to transcribe any content you submit.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">4. Privacy and Data</h3>
              <p>We do not store any audio files or transcriptions on our servers. All processing is done client-side, and your API key is stored locally in your browser.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">5. YouTube Content</h3>
              <p>When using the YouTube audio extraction feature, you must comply with YouTube's Terms of Service. We do not store or redistribute YouTube content.</p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">6. Limitations</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>The service is provided "as is" without any warranties.</li>
                <li>We are not responsible for the accuracy of transcriptions.</li>
                <li>We reserve the right to modify or discontinue the service at any time.</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-white mb-2">7. Changes to Terms</h3>
              <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of new terms.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}