/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = {
  width: 512,
  height: 512,
};
export const contentType = "image/png";

export default function Icon() {
  const iconBuffer = fs.readFileSync(path.join(process.cwd(), "public/icon.png"));
  const base64 = iconBuffer.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "transparent",
        }}
      >
        <img
          src={dataUrl}
          alt="Demir Diesel"
          width="512"
          height="512"
          style={{
            objectFit: "contain",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}

