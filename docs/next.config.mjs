import nextra from "nextra"

const nextraConfig = nextra({
    theme: "nextra-theme-docs",
    themeConfig: "./theme.config.tsx",
    standalone: true,
})

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: false,
}

export default nextraConfig(nextConfig)
