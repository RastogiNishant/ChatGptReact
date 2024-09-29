import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

const App = () => {
	const [userInput, setUserInput] = useState("");
	const [response, setResponse] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [selectedVoice, setSelectedVoice] = useState("female"); // Track selected voice
	const [highlightedWordIndex, setHighlightedWordIndex] = useState(null); // Track word index for highlighting
	const [words, setWords] = useState([]); // Store the split words from the response
	const [speaking, setSpeaking] = useState(false); // Track whether the TTS is speaking or not
	const synthRef = useRef(window.speechSynthesis); // Speech synthesis reference
	let utterance;

	// Function to get available voices (male or female)
	const getVoice = useCallback(() => {
		const voices = window.speechSynthesis.getVoices();
		// Find male or female voice based on selection
		if (selectedVoice === "male") {
			return (
				voices.find((voice) => voice.name.includes("Male")) || voices[0]
			);
		} else {
			return (
				voices.find((voice) => voice.name.includes("Female")) ||
				voices[0]
			);
		}
	}, [selectedVoice]);

	// Function to start speech synthesis with word highlighting
	const startSpeech = (text) => {
		if (synthRef.current.speaking) {
			synthRef.current.cancel(); // Cancel any ongoing speech
		}

		// Split response into words and store them
		const wordArray = text.split(" ");
		setWords(wordArray);

		let currentChunk = 0;
		let chunkSize = 20; // Number of words per chunk for TTS to speak

		// Function to speak a chunk and highlight words
		const speakChunk = (startIndex) => {
			const chunk = wordArray
				.slice(startIndex, startIndex + chunkSize)
				.join(" ");
			utterance = new SpeechSynthesisUtterance(chunk);
			utterance.voice = getVoice();

			// Use the boundary event to track word boundaries and highlight words
			utterance.onboundary = (event) => {
				const spokenWord =
					chunk.slice(0, event.charIndex).split(" ").length - 1;
				setHighlightedWordIndex(startIndex + spokenWord);
			};

			utterance.onend = () => {
				// If more chunks are remaining, speak the next one
				if (startIndex + chunkSize < wordArray.length) {
					speakChunk(startIndex + chunkSize);
				} else {
					// When all chunks are spoken, reset highlighting
					setHighlightedWordIndex(null);
					setSpeaking(false);
				}
			};

			// Speak the current chunk
			synthRef.current.speak(utterance);
			console.log("utterance", utterance);
		};

		// Start speaking the first chunk
		setSpeaking(true);
		speakChunk(currentChunk);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const res = await axios.post(
				"https://api.openai.com/v1/chat/completions",
				{
					model: "gpt-3.5-turbo",
					messages: [{ role: "user", content: userInput }],
					max_tokens: 2048,
				},
				{
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${process.env.REACT_APP_CHAT_GPT_API_KEY}`,
					},
				},
			);
			const apiResponse = res.data.choices[0].message.content.trim();
			setResponse(apiResponse);
			startSpeech(apiResponse); // Start reading the response aloud
		} catch (error) {
			console.error("Error fetching the response:", error);
			setResponse("Free tier limit exhausted");
		}
		setIsLoading(false);
	};

	// Fetch voices when component mounts
	useEffect(() => {
		const voicesChanged = () => getVoice();
		window.speechSynthesis.onvoiceschanged = voicesChanged;
	}, [getVoice, selectedVoice]);

	return (
		<div className='flex items-center justify-center min-h-screen bg-gray-100'>
			<div className='bg-white p-8 rounded shadow-md max-w-md w-full'>
				<h1 className='text-2xl font-bold mb-4 text-center'>
					ChatGPT Generator
				</h1>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<input
						type='text'
						placeholder='Ask me anything...'
						className='w-full p-2 border border-gray-300 rounded'
						value={userInput}
						onChange={(e) => setUserInput(e.target.value)}
					/>
					<button
						type='submit'
						className='w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition'
						disabled={isLoading}
					>
						{isLoading ? "Generating..." : "Submit"}
					</button>
				</form>

				{/* Voice selection buttons */}
				<div className='flex justify-center mt-4'>
					<button
						onClick={() => setSelectedVoice("male")}
						className={`p-2 mr-2 rounded ${
							selectedVoice === "male"
								? "bg-blue-500 text-white"
								: "bg-gray-200 text-black"
						}`}
					>
						Male Voice
					</button>
					<button
						onClick={() => setSelectedVoice("female")}
						className={`p-2 rounded ${
							selectedVoice === "female"
								? "bg-blue-500 text-white"
								: "bg-gray-200 text-black"
						}`}
					>
						Female Voice
					</button>
				</div>

				<div className='mt-4 p-4 bg-gray-50 rounded'>
					<h2 className='text-xl font-semibold'>
						Chat GPT Response:
					</h2>
					<p className='mt-2 text-gray-700'>
						{/* Highlight the current word being spoken */}
						{words.length > 0 &&
							words.map((word, index) => (
								<span
									key={index}
									style={{
										backgroundColor:
											index === highlightedWordIndex
												? "yellow"
												: "transparent",
									}}
								>
									{word}{" "}
								</span>
							))}
					</p>
				</div>
			</div>
		</div>
	);
};

export default App;
