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
        link: "https://discord.com",
    },
    docsRepositoryBase: "https://github.com/ryneex/authy-js/tree/main/docs",
}

export default config
