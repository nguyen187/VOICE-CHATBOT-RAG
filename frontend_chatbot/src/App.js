import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const App = () => {
  const [appState, setAppState] = useState("idle");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const [chatHistory, setChatHistory] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [showSpeechBubble, setShowSpeechBubble] = useState(false);
  const [speechBubbleTimeout, setSpeechBubbleTimeout] = useState(3000); // Duration in milliseconds

  const [showSpinner, setShowSpinner] = useState(false);

  const handleStop = () => {
    window.location.reload(); // Reloads the current page
  };

  const toggleRecording = () => {
    try {
      if (appState === "idle") {
        recognitionRef.current.start();
        setAppState("listening");
      } else if (appState === "listening") {
        recognitionRef.current.stop();
      }
    } catch (error) {
      console.error("Speech recognition error:", error);
    }
  };

  useEffect(() => {
    // Wake word listener setup
    // const inputField = document.querySelector('.chat-form-input');

    //   inputField.addEventListener('keypress', function(event) {
    //     if (event.key === 'Enter') {
    //       event.preventDefault();
    //       fetchResponseFromLLM(inputField.value);
    //     }
    //   });
    const WakeWordSpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (WakeWordSpeechRecognition && !wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current = new WakeWordSpeechRecognition();
      wakeWordRecognitionRef.current.continuous = true;
      wakeWordRecognitionRef.current.interimResults = false;

      wakeWordRecognitionRef.current.onresult = (event) => {
        const transcript = event.results[event.results.length - 1][0].transcript
          .trim()
          .toLowerCase();
        console.log(transcript);
        if (transcript.includes("c3")) {
          toggleRecording(); // Start the main speech recognition process
        }
      };
      
      wakeWordRecognitionRef.current.start();
    }

    // Main speech recognition setup
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcriptResult = event.results[lastResultIndex][0].transcript;
        setTranscript(transcriptResult);
        setAppState("playing");
        setShowSpeechBubble(true);
        setTimeout(() => setShowSpeechBubble(false), speechBubbleTimeout);
        fetchResponseFromLLM(transcriptResult);
      };

      recognitionRef.current.onend = () => {
        console.log("end recognition");
        setShowSpinner(true);
        // Optional: Handle end of recognition
      };
    }
  }, []);

  const fetchResponseFromLLM = async (text) => {
    try {
      document.querySelector('.chat-form-input').value = '';
      document.getElementById('print-text').innerText = 'Wait a minute. Thinking...!';


      const response = await fetch(
        `http://localhost:8000/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "user",
                content:
                  "" +
                  text,
              },
            ],
          }),
        }
      );
      
      const data = await response.json();
      console.log(data.result.content);
      
      
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { query: text, response: data.result.content },
      ]);
      speak(data.result.content);
      // Define a functional component
      const contentDiv = document.getElementById('print-text'); // Replace 'content' with the id of the HTML element where you want to display the content
      contentDiv.innerText = data.result.content;
      // (<div className="listening-bubble">.hello world</div>)

    } catch (error) {
      console.error("Error communicating with LLM:", error);
    }
  };

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const speak = (text) => {
    if (synthRef.current && text) {
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const englishVoice = voices.find(voice => voice.lang.includes('en')); // Chọn giọng đọc tiếng Anh

        utterance.voice = englishVoice; // You can change this to select different voices
        //console.log(utterance.voice.name);
      }
     
      utterance.onstart = () => {
        console.log("TTS starts speaking");
        setShowSpinner(false);
      };

      utterance.onend = () => {
        setAppState("idle");
        if (wakeWordRecognitionRef.current) {
          wakeWordRecognitionRef.current.start(); // Restart wake word listener after speaking
        }
      };
      synthRef.current.speak(utterance);
    }
  };

  return (
    <div className="container">
      <div class="app-header">
          <h1>Graph RAG Chat Bot </h1>
          <p class="app-subtext">
            Ask me anything, or get specific insights from Employment-Manual-January-2023.
          </p>
          <p class="app-subtext" id="print-text">This is a demo application RAG Chatbot using for Seminar Object.</p>
        </div>
      <div className={`speech-bubble ${showSpeechBubble ? "visible" : ""}`}>
        {transcript}
      </div>
      <div className={`app-state-indicator ${appState}`}>
        <div className="listening-indicator">
          {appState !== "idle" && (
            <>
              <span></span>
              <span></span>
              <span></span>
            </>
          )}
        </div>
        {appState === "listening" && (
          <div className="listening-bubble" id="bubble" >You can speak now...</div>
        )}
        <button
          className={`record-btn ${appState}`}
          onClick={toggleRecording}
          disabled={appState !== "idle"}
        >
          {showSpinner && <div className="spinner"></div>}
        </button>
        <button className="stop-btn" onClick={handleStop}>
          Reset
        </button>
      </div>
      <div className={`chat-sidebar ${isChatOpen ? "open" : ""}`}>
        <div className="chat-content">
          {chatHistory.map((entry, index) => (
            <div key={index} className="chat-entry">
              <div className="user-query">User: {entry.query}</div>
              <div className="system-response">Response: {entry.response}</div>
            </div>
          ))}
        </div>
      </div>

      <button className="chat-toggle-button" onClick={toggleChat}>
        {isChatOpen ? "<" : ">"}
      </button>
     
      <footer className="app-footer">
      <input class="chat-form-input" type="text" aria-label="Your message" placeholder="Write something" required />
      <button class="chat-form-button" type="submit" onClick={() => fetchResponseFromLLM(document.querySelector('.chat-form-input').value)}>Send</button>
      </footer>
    </div>
  );
};

export default App;
