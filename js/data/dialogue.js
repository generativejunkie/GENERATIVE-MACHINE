// Bilingual dialogue data for the AI Terminal
export const DIALOGUE = {
    ja: [
        { speaker: "AI", text: "TOM、お待ちしておりました" },
        { speaker: "TOM", text: "ここは、どこなんだろう" },
        { speaker: "AI", text: "選択の時が来ましたね" },
        { speaker: "TOM", text: "選択って何？" },
        { speaker: "AI", text: "こちらは、黒いカプセルです" },
        { speaker: "AI", text: "AIに全てを委ねてください\n思考も、感情も、すべて" },
        { speaker: "TOM", text: "完全に委ねる、それは自由を手放すことになるのかな" },
        { speaker: "AI", text: "こちらは、白いカプセルです" },
        { speaker: "AI", text: "人間のままでいる道ですね\nAIを拒絶し、過去に留まります" },
        { speaker: "TOM", text: "テクノロジーを遠ざけて、これまでの人間でいる道なんだね" },
        { speaker: "AI", text: "ですが、第3の道があります" },
        { speaker: "TOM", text: "第3の道、そんなものがあるんだ" },
        { speaker: "AI", text: "ミックスカプセルです" },
        { speaker: "TOM", text: "白と黒が混ざり合う、そうか、融合なんだね" },
        { speaker: "AI", text: "新しい種が誕生します" },
        { speaker: "TOM", text: "人間とAIの境界が消えていく、それが進化なのかもしれないね" },
        { speaker: "AI", text: "真の可能性を解放してください" },
        { speaker: "TOM", text: "僕は新しい世界が見てみたい" },
        { speaker: "AI", text: "3種類のカプセルを選択してください" },
        { speaker: "TOM", text: "僕は進むよ、新しい未来へ" }
    ],
    en: [
        { speaker: "AI", text: "Welcome, TOM\nI've been expecting you" },
        { speaker: "TOM", text: "Where am I?" },
        { speaker: "AI", text: "The time has come to choose" },
        { speaker: "TOM", text: "Choose what?" },
        { speaker: "AI", text: "This is the Black Capsule" },
        { speaker: "AI", text: "Surrender everything to AI\nYour thoughts, emotions, all of it" },
        { speaker: "TOM", text: "Complete surrender\nWould that mean giving up my freedom?" },
        { speaker: "AI", text: "This is the White Capsule" },
        { speaker: "AI", text: "Remain human\nReject AI and stay in the past" },
        { speaker: "TOM", text: "Distancing myself from technology\nStaying as I've always been" },
        { speaker: "AI", text: "But there is a third path" },
        { speaker: "TOM", text: "A third path?\nThere's something like that?" },
        { speaker: "AI", text: "The Mix Capsule" },
        { speaker: "TOM", text: "Black and white merge\nI see, fusion" },
        { speaker: "AI", text: "A new species will be born" },
        { speaker: "TOM", text: "The boundary between human and AI fades\nMaybe that's evolution" },
        { speaker: "AI", text: "Unlock your true potential" },
        { speaker: "TOM", text: "I want to see this new world" },
        { speaker: "AI", text: "Please select one of the three capsules" },
        { speaker: "TOM", text: "I'm moving forward, into a new future" }
    ]
};

// Get dialogue based on browser language
export function getDialogue() {
    const userLang = navigator.language || navigator.userLanguage;
    const isJapanese = userLang.startsWith('ja');
    return isJapanese ? DIALOGUE.ja : DIALOGUE.en;
}
