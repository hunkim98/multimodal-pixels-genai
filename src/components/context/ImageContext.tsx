import { createContext, useState } from "react";

interface Props {
  children: JSX.Element | Array<JSX.Element>;
}

export interface ImageContextProps {
  base64Image: string | undefined;
  setBase64Image: (base64Image: string | undefined) => void;
  imageUrlToEdit: string | undefined;
  setImageUrlToEdit: (imageUrlToEdit: string | undefined) => void;
}

const ImageContext = createContext<ImageContextProps>({} as ImageContextProps);

const ImageContextProvider = ({ children }: Props): JSX.Element => {
  const [base64Image, setBase64Image] = useState<string | undefined>();
  const [imageUrlToEdit, setImageUrlToEdit] = useState<string | undefined>();
  return (
    <ImageContext.Provider
      value={{
        base64Image,
        setBase64Image,
        imageUrlToEdit,
        setImageUrlToEdit,
      }}
    >
      {children}
    </ImageContext.Provider>
  );
};

export { ImageContextProvider, ImageContext };
