import React from "react"
import { DocsThemeConfig } from "nextra-theme-docs"

const config: DocsThemeConfig = {
    logo: <span className="font-bold text-lg">Authy-JS</span>,

    project: {
        link: "https://github.com/ryneex/authy-js",
    },
    sidebar: {
        toggleButton: true,
    },
    chat: {
        link: "https://discord.com/users/893972714547724368",
    },
    footer: {
        component: "",
    },
    docsRepositoryBase: "https://github.com/ryneex/authy-js/tree/main/docs",
    useNextSeoProps() {
        return {
            titleTemplate: "%s | Authy-JS",
            defaultTitle: "Authy-JS Documentation",
            description: "A detailed documentation for Authy-JS.",
            keywords: ["Authy-JS", "Authentication", "Documentation", "Authy JS Documentation", "Authy JS Docs", "Learn Authy-JS"],
            openGraph: {
                type: "website",
                locale: "en_US",
                url: "https://authy-js.vercel.com",
                site_name: "Authy-JS",
                description: "A detailed documentation for Authy-JS.",
            },
        }
    },
}

export default config
