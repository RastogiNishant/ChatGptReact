import React, { useState } from "react";
import axios from "axios";

const App = () => {
	const [userInput, setUserInput] = useState("");
	const [response, setResponse] = useState("");
	const [isLoading, setIsLoading] = useState(false);

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

			setResponse(res.data.choices[0].message.content.trim());
		} catch (error) {
			console.error("Error fetching the response:", error);
			setResponse("Free tier limit exhausted");
		}

		setIsLoading(false);
	};

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
				<div className='mt-4 p-4 bg-gray-50 rounded'>
					<h2 className='text-xl font-semibold'>Response:</h2>
					<p className='mt-2 text-gray-700'>
						{response || "Your generated content will appear here."}
					</p>
				</div>
			</div>
		</div>
	);
};

export default App;
