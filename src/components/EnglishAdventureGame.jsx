import React, { useState } from 'react';
import { BookOpen, Target, Award, Play, RotateCcw, Sparkles, Loader } from 'lucide-react';

const EnglishAdventureGame = () => {
    const [gameState, setGameState] = useState('menu');
    const [currentScene, setCurrentScene] = useState(0);
    const [score, setScore] = useState(0);
    const [vocabulary, setVocabulary] = useState([]);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [scenes, setScenes] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [gameMode, setGameMode] = useState(null); // 'preset' or 'ai'

    const presetScenes = [
        {
            id: 0,
            situation: "The Mysterious Cafe",
            description: "You enter a cozy cafe in London. A friendly barista greets you.",
            dialogue: "Good morning! What can I get for you today?",
            question: "What does 'cozy' mean?",
            options: [
                { text: "寒い", correct: false, explanation: "'Cozy'は「居心地の良い、暖かい」という意味です。" },
                { text: "居心地の良い", correct: true, explanation: "正解!「Cozy」は暖かくて快適な雰囲気を表します。" },
                { text: "混雑した", correct: false, explanation: "'Cozy'は「居心地の良い、暖かい」という意味です。" },
                { text: "高級な", correct: false, explanation: "'Cozy'は「居心地の良い、暖かい」という意味です。" }
            ],
            vocabulary: ["cozy", "greet", "barista"]
        },
        {
            id: 1,
            situation: "Ordering Coffee",
            description: "You look at the menu. There are many options to choose from.",
            dialogue: "We have espresso, cappuccino, and latte. Our specialty is the caramel macchiato!",
            question: "What does 'specialty' mean in this context?",
            options: [
                { text: "普通のメニュー", correct: false, explanation: "'Specialty'は「特製品、おすすめ」という意味です。" },
                { text: "特製品、おすすめ", correct: true, explanation: "正解!お店の自慢のメニューという意味です。" },
                { text: "最も安い商品", correct: false, explanation: "'Specialty'は「特製品、おすすめ」という意味です。" },
                { text: "新商品", correct: false, explanation: "'Specialty'は「特製品、おすすめ」という意味です。" }
            ],
            vocabulary: ["specialty", "options", "caramel macchiato"]
        },
        {
            id: 2,
            situation: "Making Conversation",
            description: "While waiting for your coffee, you chat with the barista.",
            dialogue: "Are you visiting London, or do you live here? The weather is quite unpredictable today!",
            question: "What does 'unpredictable' mean?",
            options: [
                { text: "予測できない", correct: true, explanation: "正解!天気が変わりやすいという意味です。" },
                { text: "晴れている", correct: false, explanation: "'Unpredictable'は「予測できない」という意味です。" },
                { text: "寒い", correct: false, explanation: "'Unpredictable'は「予測できない」という意味です。" },
                { text: "快適な", correct: false, explanation: "'Unpredictable'は「予測できない」という意味です。" }
            ],
            vocabulary: ["unpredictable", "weather", "quite"]
        }
    ];

    // AIでシーンを生成（フロントは /api/generate-scene に投げる）
    const generateAIScene = async (sceneNumber) => {
        setIsGenerating(true);
        try {
            const payload = {
                model: "claude-sonnet-4-20250514",
                max_tokens: 1000,
                messages: [
                    {
                        role: "user",
                        content: `You are creating an English learning game scene. Generate scene ${sceneNumber + 1} of an adventure story.

Requirements:
- Create an engaging situation for English learners (intermediate level)
- Include natural English dialogue
- Create a vocabulary question with 4 options (1 correct, 3 incorrect)
- Provide Japanese translations for options and explanations
- Include 3 key vocabulary words from the scene

Return ONLY a JSON object (no markdown, no preamble) in this exact format:
{
  "situation": "Scene title in English",
  "description": "Scene description in English",
  "dialogue": "Character dialogue in English",
  "question": "Question about a word/phrase from the dialogue",
  "options": [
    {"text": "Japanese answer 1", "correct": false, "explanation": "Explanation in Japanese"},
    {"text": "Japanese answer 2", "correct": true, "explanation": "Explanation in Japanese"},
    {"text": "Japanese answer 3", "correct": false, "explanation": "Explanation in Japanese"},
    {"text": "Japanese answer 4", "correct": false, "explanation": "Explanation in Japanese"}
  ],
  "vocabulary": ["word1", "word2", "word3"]
}

Make it interesting and educational!`
                    }
                ]
            };

            const res = await fetch('/api/generate-scene', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            // Anthropicのレスポンス構造に応じて適切に取り出す
            const textContent = (data?.content || data?.choices?.[0]?.message?.content || '');
            // いくつかのAnthropicレスポンス形式を想定して安全に抽出
            let rawText = "";
            if (typeof textContent === "string") rawText = textContent;
            else if (Array.isArray(data?.content)) {
                const found = data.content.find(c => c.type === "text");
                rawText = found?.text || JSON.stringify(data);
            } else {
                rawText = JSON.stringify(data);
            }

            const cleaned = rawText.replace(/```json\n?|\n?```/g, '').trim();
            let sceneData;
            try {
                sceneData = JSON.parse(cleaned);
            } catch (err) {
                console.error('JSON parse failed', err, cleaned)
                // フォールバック: 単純なエラーメッセージシーン
                sceneData = {
                    situation: "AI Generation Error",
                    description: "Could not parse generated scene.",
                    dialogue: "...",
                    question: "Would you like to try again?",
                    options: [
                        { text: "はい", correct: true, explanation: "もう一度お試しください。" },
                        { text: "いいえ", correct: false, explanation: "了解です。" },
                        { text: "わからない", correct: false, explanation: "了解です。" },
                        { text: "後で", correct: false, explanation: "了解です。" }
                    ],
                    vocabulary: ["error"]
                };
            }

            return { id: sceneNumber, ...sceneData };
        } catch (error) {
            console.error("AI generation error:", error);
            return {
                id: sceneNumber,
                situation: "Generation Error",
                description: "Unable to generate scene. Please try again.",
                dialogue: "...",
                question: "Would you like to try again?",
                options: [
                    { text: "はい", correct: true, explanation: "もう一度お試しください。" },
                    { text: "いいえ", correct: false, explanation: "もう一度お試しください。" },
                    { text: "わからない", correct: false, explanation: "もう一度お試しください。" },
                    { text: "後で", correct: false, explanation: "もう一度お試しください。" }
                ],
                vocabulary: ["error", "retry", "again"]
            };
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAnswer = (optionIndex) => {
        setSelectedAnswer(optionIndex);
        setShowFeedback(true);

        const option = scenes[currentScene].options[optionIndex];
        if (option && option.correct) {
            setScore(prev => prev + 10);
            const newVocab = scenes[currentScene].vocabulary.filter(word => !vocabulary.includes(word));
            setVocabulary(prev => [...prev, ...newVocab]);
        }
    };

    const nextScene = async () => {
        if (currentScene < scenes.length - 1) {
            setCurrentScene(prev => prev + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else if (gameMode === 'ai') {
            const newScene = await generateAIScene(scenes.length);
            setScenes(prev => [...prev, newScene]);
            setCurrentScene(prev => prev + 1);
            setSelectedAnswer(null);
            setShowFeedback(false);
        } else {
            setGameState('complete');
        }
    };

    const startGame = async (mode) => {
        setGameMode(mode);
        setGameState('playing');
        setCurrentScene(0);
        setScore(0);
        setVocabulary([]);
        setSelectedAnswer(null);
        setShowFeedback(false);

        if (mode === 'preset') {
            setScenes(presetScenes);
        } else {
            const firstScene = await generateAIScene(0);
            setScenes([firstScene]);
        }
    };

    const MenuScreen = () => (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h1 className="text-4xl font-bold text-gray-800 mb-2">English Adventure</h1>
                <p className="text-gray-600 mb-6">ストーリーで学ぶ英語学習ゲーム</p>
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h2 className="font-semibold text-blue-900 mb-2">モードを選択</h2>
                    <p className="text-sm text-blue-800 mb-4">
                        プリセットモードで基本を学ぶか、AIモードで無限のストーリーを体験しよう!
                    </p>
                </div>
                <div className="space-y-3">
                    <button onClick={() => startGame('preset')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition w-full flex items-center justify-center gap-2">
                        <Play className="w-5 h-5" /> プリセットモード (3シーン)
                    </button>
                    <button onClick={() => startGame('ai')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition w-full flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" /> AIモード (無限に生成)
                    </button>
                </div>
            </div>
        </div>
    );

    const GameScreen = () => {
        const scene = scenes[currentScene];

        if (!scene) {
            return (
                <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                        <Loader className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                        <p className="text-gray-700">シーンを読み込み中...</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-4 mb-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Target className="w-6 h-6 text-purple-600" />
                            <span className="font-semibold">スコア: {score}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {gameMode === 'ai' && <Sparkles className="w-5 h-5 text-yellow-500" />}
                            <Award className="w-6 h-6 text-yellow-500" />
                            <span className="text-sm">習得: {vocabulary.length}語</span>
                        </div>
                        <div className="text-sm text-gray-600">
                            シーン {currentScene + 1} {gameMode === 'preset' ? `/ ${scenes.length}` : ''}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-8">
                        <h2 className="text-3xl font-bold text-purple-800 mb-4">{scene.situation}</h2>
                        <div className="bg-purple-50 rounded-lg p-6 mb-6">
                            <p className="text-gray-700 mb-4">{scene.description}</p>
                            <div className="bg-white rounded-lg p-4 border-l-4 border-purple-600">
                                <p className="text-lg italic text-gray-800">"{scene.dialogue}"</p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4">{scene.question}</h3>
                            <div className="grid grid-cols-1 gap-3">
                                {scene.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => !showFeedback && handleAnswer(index)}
                                        disabled={showFeedback}
                                        className={`p-4 rounded-lg text-left transition ${showFeedback
                                                ? selectedAnswer === index
                                                    ? option.correct
                                                        ? 'bg-green-100 border-2 border-green-500'
                                                        : 'bg-red-100 border-2 border-red-500'
                                                    : option.correct
                                                        ? 'bg-green-50 border-2 border-green-300'
                                                        : 'bg-gray-100'
                                                : 'bg-gray-50 hover:bg-purple-50 border-2 border-gray-200 hover:border-purple-300'
                                            }`}
                                    >
                                        <span className="font-semibold">{String.fromCharCode(65 + index)}.</span> {option.text}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {showFeedback && (
                            <div className="mb-6">
                                <div className={`rounded-lg p-4 ${scenes[currentScene].options[selectedAnswer].correct
                                        ? 'bg-green-50 border-2 border-green-300'
                                        : 'bg-red-50 border-2 border-red-300'
                                    }`}>
                                    <p className="text-gray-800">
                                        {scenes[currentScene].options[selectedAnswer].explanation}
                                    </p>
                                </div>

                                <button
                                    onClick={nextScene}
                                    disabled={isGenerating}
                                    className="mt-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-bold py-3 px-6 rounded-lg w-full transition flex items-center justify-center gap-2"
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader className="w-5 h-5 animate-spin" />
                                            次のシーンを生成中...
                                        </>
                                    ) : (
                                        <>
                                            {gameMode === 'ai' ? '次のシーンを生成' :
                                                currentScene < scenes.length - 1 ? '次のシーンへ' : '結果を見る'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}

                        <div className="bg-blue-50 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-2">このシーンの重要単語:</h4>
                            <div className="flex flex-wrap gap-2">
                                {scene.vocabulary.map((word, index) => (
                                    <span key={index} className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm">
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const CompleteScreen = () => (
        <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <Award className="w-20 h-20 text-yellow-500 mx-auto mb-4" />
                <h2 className="text-4xl font-bold text-gray-800 mb-4">お疲れ様でした!</h2>

                <div className="bg-green-50 rounded-lg p-6 mb-6">
                    <div className="text-3xl font-bold text-green-700 mb-2">{score} ポイント</div>
                    <p className="text-gray-700">習得単語: {vocabulary.length}個</p>
                    <p className="text-sm text-gray-600 mt-2">完了シーン: {scenes.length}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-blue-900 mb-2">習得した単語:</h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {vocabulary.map((word, index) => (
                            <span key={index} className="bg-blue-200 text-blue-900 px-3 py-1 rounded-full text-sm">
                                {word}
                            </span>
                        ))}
                    </div>
                </div>

                <button onClick={() => setGameState('menu')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition flex items-center justify-center mx-auto gap-2">
                    <RotateCcw className="w-5 h-5" />
                    メニューに戻る
                </button>
            </div>
        </div>
    );

    return (
        <div>
            {gameState === 'menu' && <MenuScreen />}
            {gameState === 'playing' && <GameScreen />}
            {gameState === 'complete' && <CompleteScreen />}
        </div>
    );
};

export default EnglishAdventureGame;
