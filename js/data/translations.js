// Language detection utility
export function detectLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    return userLang.startsWith('ja') ? 'ja' : 'en';
}

// Site-wide translations (excluding About/Manifesto which stays bilingual)
export const TRANSLATIONS = {
    hero: {
        title: {
            en: "GENERATIVE MACHINE",
            ja: "GENERATIVE MACHINE"
        },
        description: {
            en: "An immersive journey through algorithmic beauty and emergent creativity. Experience the fusion of human intuition and machine intelligence through interactive visual and auditory systems.",
            ja: "アルゴリズムの美と創発的創造性への没入体験。インタラクティブな視覚と聴覚のシステムを通じて、人間の直観と機械知性の融合を体験してください。"
        }
    },

    sections: {
        imagemachine: {
            title: {
                en: "IMAGE MACHINE",
                ja: "IMAGE MACHINE"
            },
            description: {
                en: "A visual generative apparatus. 389 images flow through random transition effects, creating unexpected aesthetic moments. Click, tap, or press space to trigger the next transformation.",
                ja: "ビジュアル生成装置。389枚の画像がランダムなトランジションエフェクトを通じて流れ、予期せぬ美的瞬間を創り出します。クリック、タップ、またはスペースキーで次の変換を発動してください。"
            },
            stats: {
                clickTap: {
                    en: "CLICK / TAP — Switch Image",
                    ja: "クリック / タップ — 画像切替"
                },
                space: {
                    en: "SPACE — Next Image",
                    ja: "SPACE — 次の画像"
                },
                images: {
                    en: "389 Images",
                    ja: "389枚の画像"
                },
                effects: {
                    en: "15 Effects",
                    ja: "15種のエフェクト"
                }
            }
        },

        soundmachine: {
            title: {
                en: "SOUND MACHINE",
                ja: "SOUND MACHINE"
            },
            description: {
                en: "An audio-reactive visualization system. Your microphone input transforms into dynamic visual patterns. The capsules respond to frequency, rhythm, and amplitude in real-time.",
                ja: "オーディオリアクティブな可視化システム。マイク入力が動的なビジュアルパターンへと変換されます。カプセルは周波数、リズム、振幅にリアルタイムで反応します。"
            }
        },

        store: {
            title: {
                en: "OFFICIAL STORE",
                ja: "OFFICIAL STORE"
            },
            description: {
                en: "Physical artifacts from the GENERATIVE MACHINE universe. Limited apparel, art prints, and original merchandise that bridge the digital and material realms.",
                ja: "GENERATIVE MACHINEの世界観から生まれた物理的なアーティファクト。デジタルと物質の領域を架橋する限定アパレル、アートプリント、オリジナルグッズ。"
            },
            card: {
                title: {
                    en: "Apparel & Goods",
                    ja: "アパレル & グッズ"
                },
                description: {
                    en: "Limited apparel, art prints, and original merchandise",
                    ja: "限定アパレル、アートプリント、オリジナルグッズ"
                },
                button: {
                    en: "Visit Store",
                    ja: "ストアへ"
                }
            }
        },

        about: {
            title: {
                en: "ABOUT",
                ja: "ABOUT"
            },
            description: {
                en: "GENERATIVE JUNKIE is a creative collective exploring prompt engineering as a pure form of expression—where human intuition, conceptual design, and algorithmic logic converge.",
                ja: "GENERATIVE JUNKIEは、プロンプトエンジニアリングを純粋な表現形式として追求するクリエイティブ・コレクティブです。人間の直観、コンセプト設計、アルゴリズムが交差する地点を探求します。"
            }
        }
    },

    nav: {
        imagemachine: {
            en: "Image",
            ja: "イメージ"
        },
        soundmachine: {
            en: "Sound",
            ja: "サウンド"
        },
        store: {
            en: "Store",
            ja: "ストア"
        },
        about: {
            en: "About",
            ja: "について"
        }
    },

    footer: {
        text: {
            en: "ALL WAYS SUPER HIGH",
            ja: "ALL WAYS SUPER HIGH"
        }
    }
};
