import React, { useState } from "react";
import { Button, Image } from "@adobe/react-spectrum";
import StarOutline from "@spectrum-icons/workflow/StarOutline";
import Star from "@spectrum-icons/workflow/Star";
import { AssistiveImageInputType } from "@/pages";

interface ImageComponentProps {
  image: string;
  setImageUrlToEdit: (url: string) => void;
  setIsAssistiveCanvasOpen: (isOpen: boolean) => void;
  addFavoriteImage: (url: string) => void;
  removeFavoriteImage: (url: string) => void;
  favoriteImages: string[];
  selectedAsssistivImageInputType: AssistiveImageInputType;
}

function ImageComponent({
  image,
  setImageUrlToEdit,
  setIsAssistiveCanvasOpen,
  addFavoriteImage,
  removeFavoriteImage,
  favoriteImages,
  selectedAsssistivImageInputType,
}: ImageComponentProps) {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  return (
    <div
      key={image}
      className="relative w-[25%]"
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
        UNSAFE_className="hover:scale-105 transition duration-500 ease-in-out select-none"
        alt={"image"}
        key={image}
        src={image}
        width={"100%"}
        height={"100%"}
        // width={300}
        // height={300}
      />
      <div
        className="z-10 absolute top-5 right-5 hover:scale-120 transition duration-500 ease-in-out"
        onClick={() => {
          // alert("hi");
          if (favoriteImages.includes(image)) {
            removeFavoriteImage(image);
          } else {
            addFavoriteImage(image);
          }
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="25"
          viewBox="0 0 25 25"
          width="25"
        >
          <defs></defs>
          <title>S Heart 18 N</title>
          <rect id="Canvas" fill="#ff13dc" opacity="0" width="25" height="25" />
          <path
            fill={
              favoriteImages.includes(image) ? "red" : "rgba(255,255,255,0.5)"
            }
            d="M12.182,3.2545A4.00649,4.00649,0,0,0,9,5.1635a4.00649,4.00649,0,0,0-3.182-1.909A3.818,3.818,0,0,0,2,7.0725c0,3.646,7,8.273,7,8.273s7-4.578,7-8.273A3.818,3.818,0,0,0,12.182,3.2545Z"
          />
        </svg>
      </div>
      {isHovered &&
        selectedAsssistivImageInputType !== AssistiveImageInputType.NULL && (
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
