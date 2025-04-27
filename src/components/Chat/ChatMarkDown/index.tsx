import React from 'react'
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from 'rehype-katex'
import ReactMarkdown from "react-markdown"

const processKatexInMarkdown = (markdown: string) => {
  const markdownWithKatexSyntax = markdown
    .replace(/\\\\\[/g, '$$$$')
    .replace(/\\\\\]/g, '$$$$')
    .replace(/\\\\\(/g, '$$$$')
    .replace(/\\\\\)/g, '$$$$')
    .replace(/\\\[/g, '$$$$')
    .replace(/\\\]/g, '$$$$')
    .replace(/\\\(/g, '$$$$')
    .replace(/\\\)/g, '$$$$')
  return markdownWithKatexSyntax
}

const ChatMarkdown = ({ content }: { content: string }) => {
  return (
    <div className="font-[Manrope] text-base leading-5 text-left whitespace-pre-wrap">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, [remarkMath, { singleDollarTextMath: false }]]}
        rehypePlugins={[
          () => {
            return rehypeKatex({ output: 'mathml' })
          },
        ]}
      >
        {processKatexInMarkdown(content)}
      </ReactMarkdown>
    </div>
  )
}

export default ChatMarkdown