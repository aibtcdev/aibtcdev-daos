import { jsxRenderer } from "hono/jsx-renderer";

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html>
      <head>
        <title>AIBTC on Hono</title>
      </head>
      <body>{children}</body>
    </html>
  );
});
