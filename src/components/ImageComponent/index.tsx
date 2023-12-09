import React, { useState } from "react";
import { Button, Image } from "@adobe/react-spectrum";

interface ImageComponentProps {
  image: string;
  setImageUrlToEdit: (url: string) => void;
  setIsAssistiveCanvasOpen: (isOpen: boolean) => void;
}

function ImageComponent({
  image,
  setImageUrlToEdit,
  setIsAssistiveCanvasOpen,
}: ImageComponentProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  return (
    <div
      key={image}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* {isHovered && (
        <div
          className="absolute top-0 left-0 w-[300px] h-[300px] bg-black opacity-50"
          style={{ zIndex: 1 }}
        />
      )} */}
      <Image
        UNSAFE_className="mb-4"
        alt={"image"}
        key={image}
        src={image}
        width={300}
        height={300}
      />
      {isHovered && (
        <Button
          variant="secondary"
          // UNSAFE_className="absolute top-0 right-0"
          UNSAFE_className="bg-white"
          UNSAFE_style={{
            zIndex: 2,
            position: "absolute",
            bottom: 25,
            right: 15,
            color: "#fff",
          }}
          onPress={() => {
            setImageUrlToEdit(image);
            setIsAssistiveCanvasOpen(true);
          }}
        >
          Edit
        </Button>
      )}
    </div>
  );
}

export default ImageComponent;
