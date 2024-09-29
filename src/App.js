import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const App = () => {
	const [userInput, setUserInput] = useState("");
	const [response, setResponse] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [selectedVoice, setSelectedVoice] = useState("female"); // To track the selected voice
	const [highlightedText, setHighlightedText] = useState(""); // For highlighting words

	let speechSynthesisUtterance;

	// Function to fetch available voices (male or female)
	const getVoices = useCallback(() => {
		const voices = window.speechSynthesis.getVoices();
		// Filter for male/female voices, this is basic and depends on available voices in the browser.
		const maleVoices = voices.filter((voice) =>
			voice.name.includes("Male"),
		);
		const femaleVoices = voices.filter((voice) =>
			voice.name.includes("Female"),
		);
		return selectedVoice === "female" ? femaleVoices[0] : maleVoices[0];
	}, [selectedVoice]);

	// Function to start speech synthesis with word highlighting
	const startSpeech = (text) => {
		speechSynthesisUtterance = new SpeechSynthesisUtterance(text);
		speechSynthesisUtterance.voice = getVoices();

		const words = text.split(" ");
		let wordIndex = 0;

		speechSynthesisUtterance.onboundary = (event) => {
			if (event.name === "word") {
				setHighlightedText(
					words.slice(0, wordIndex + 1).join(" ") + " ",
				);
				wordIndex += 1;
			}
		};

		speechSynthesis.speak(speechSynthesisUtterance);
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

	useEffect(() => {
		window.speechSynthesis.onvoiceschanged = getVoices;
	}, [getVoices]);

	return (
		<div className='flex items-center justify-center min-h-screen bg-gray-100'>
			<div className='bg-white p-8 rounded shadow-md max-w-md w-full'>
				<h1 className='text-2xl font-bold mb-4 text-center'>
					ChatGPT Generator
				</h1>
				<form onSubmit={handleSubmit} className='space-y-4'>
					<input
						type='text'
						placeholder='Enter your prompt...'
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
					<h2 className='text-xl font-semibold'>Response:</h2>
					<p className='mt-2 text-gray-700'>
						{/* Highlight the current text being spoken */}
						<span>{highlightedText}</span>
						<span style={{ color: "blue" }}>
							{response.slice(highlightedText.length)}
						</span>
					</p>
				</div>
			</div>
		</div>
	);
};

export default App;
