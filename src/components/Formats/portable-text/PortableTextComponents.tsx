// components/portable-text/PortableTextComponents.tsx
import React from 'react'

export const portableTextComponents = {
  block: {
    normal: ({ children }: { children: React.ReactNode }) => <p className="mb-6 leading-relaxed text-gray-700 text-lg">{children}</p>,
    h1: ({ children }: { children: React.ReactNode }) => <h1 className="text-3xl font-bold mb-6 mt-8 text-blue-800">{children}</h1>,
    h2: ({ children }: { children: React.ReactNode }) => <h2 className="text-2xl font-bold mb-6 mt-8 text-blue-700 border-b-2 border-blue-200 pb-2">{children}</h2>,
    h3: ({ children }: { children: React.ReactNode }) => <h3 className="text-xl font-bold mb-6 mt-8 text-blue-600">{children}</h3>,
    h4: ({ children }: { children: React.ReactNode }) => <h4 className="text-lg font-bold mb-6 mt-8 text-blue-600">{children}</h4>,
  },
  list: {
    bullet: ({ children }: { children: React.ReactNode }) => <ul className="list-disc pr-6 mb-6 space-y-2">{children}</ul>,
  },
  listItem: {
    bullet: ({ children }: { children: React.ReactNode }) => <li className="text-gray-700 text-lg">{children}</li>,
  },
  marks: {
    strong: ({ children }: { children: React.ReactNode }) => <span className="font-bold text-gray-900">{children}</span>,
    em: ({ children }: { children: React.ReactNode }) => <span className="italic">{children}</span>,
    underline: ({ children }: { children: React.ReactNode }) => <span className="underline">{children}</span>,
  },
}