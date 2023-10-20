import {
  ImageContext,
  ImageContextProvider,
} from "@/components/context/ImageContext";
import "@/styles/globals.css";
import { Provider, SSRProvider, defaultTheme } from "@adobe/react-spectrum";
import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Provider theme={defaultTheme} colorScheme="light">
      <ImageContextProvider>
        <Component {...pageProps} />
      </ImageContextProvider>
    </Provider>
  );
}
