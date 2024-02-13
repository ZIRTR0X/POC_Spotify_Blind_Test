import type { NextPage } from "next";
import { signIn, signOut, useSession } from "next-auth/react";
import Head from "next/head";
import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactPlayer from "react-player";
import { ITrack } from "~/models/itrack";
import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Link,
  Navbar,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  NextUIProvider,
  User,
} from "@nextui-org/react";
import Image from "next/image";

const SPOTIFY_LIBRARY_ENDPOINT = "https://api.spotify.com/v1/me/tracks";

const Home: NextPage = () => {
  const session = useSession();
  const [playingTrack, setPlayingTrack] = useState(null) as [
    ITrack | null,
    Function,
  ];
  const [userAnswer, setUserAnswer] = useState("");
  const [score, setScore] = useState(0);
  const [artistsFoundNumber, setArtistsFoundNumber] = useState(0);
  const [artistsFound, setArtistsFound] = useState([] as string[]);
  const [totalArtistsNumber, setTotalArtistsNumber] = useState(0);
  const [musicTitleFound, setMusicTitleFound] = useState("");
  const spotifyLogo = (
    <svg
      width="24"
      height="24"
      xmlns="http://www.w3.org/2000/svg"
      fill-rule="evenodd"
      clip-rule="evenodd"
    >
      <path d="M19.098 10.638c-3.868-2.297-10.248-2.508-13.941-1.387-.593.18-1.22-.155-1.399-.748-.18-.593.154-1.22.748-1.4 4.239-1.287 11.285-1.038 15.738 1.605.533.317.708 1.005.392 1.538-.316.533-1.005.709-1.538.392zm-.126 3.403c-.272.44-.847.578-1.287.308-3.225-1.982-8.142-2.557-11.958-1.399-.494.15-1.017-.129-1.167-.623-.149-.495.13-1.016.624-1.167 4.358-1.322 9.776-.682 13.48 1.595.44.27.578.847.308 1.286zm-1.469 3.267c-.215.354-.676.465-1.028.249-2.818-1.722-6.365-2.111-10.542-1.157-.402.092-.803-.16-.895-.562-.092-.403.159-.804.562-.896 4.571-1.045 8.492-.595 11.655 1.338.353.215.464.676.248 1.028zm-5.503-17.308c-6.627 0-12 5.373-12 12 0 6.628 5.373 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12z" />
    </svg>
  );

  useEffect(() => {
    if (session.status === "authenticated") {
      getRandomSongFromLibrary(session, setPlayingTrack);
    }
  }, [session]);

  async function getRandomSongFromLibrary(
    session: any,
    setPlayingTrack: Function,
  ) {
    try {
      const accessToken = session.data.user.accessToken;

      const response = await axios.get(SPOTIFY_LIBRARY_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const tracks = response.data.items.map((item: any) => item.track);

      if (tracks.length === 0) {
        console.log("User has no tracks in their library.");
        return;
      }

      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];

      console.log("Random Track:", {
        name: randomTrack.name,
        artist: randomTrack.artists
          .map((artist: any) => artist.name)
          .join(", "),
        uri: randomTrack.uri,
      });

      setPlayingTrack(randomTrack);

      initMusicStats(randomTrack);
    } catch (error: any) {
      console.error(
        "Error fetching user library:",
        error.response?.data || error.message,
      );
    }
  }

  function initMusicStats(randomTrack: ITrack) {
    //TODO: créer une interface pour randomTrack
    setArtistsFound([]);
    setArtistsFoundNumber(0);
    setMusicTitleFound("");
    setTotalArtistsNumber(randomTrack.artists.length || 0);
  }

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };

  const handleSubmitAnswer = () => {
    handleAnswer(userAnswer);

    if (checkEndGame()) getRandomSongFromLibrary(session, setPlayingTrack);
  };

  /** Return `true` if all artists are found and the music title is found. */
  function checkEndGame(): boolean {
    return artistsFoundNumber === totalArtistsNumber && musicTitleFound !== "";
  }

  /** Handle the user's answer and update the score.
   * @param answer The user's answer.
   */
  function handleAnswer(answer: string) {
    if (!playingTrack) return;

    console.log("playingTrack:", playingTrack);

    if (checkMusicTitle(answer)) {
      console.log("Title found:", playingTrack.name);

      setScore(score + 100);
    } else {
      const artistsFound = getArtistsFoundNumber(answer);
      const artistsNumber = playingTrack.artists.length;
      const artistsPercentage = (artistsFound / artistsNumber) * 100;

      if (artistsFound > 0) {
        console.log(
          "Artists found:",
          artistsFound,
          "/",
          artistsNumber,
          "(",
          artistsPercentage,
          "%)",
        );

        setScore(score + artistsPercentage);
      }
    }
  }

  /** Calculate the match percentage between the song title and the user's answer.
   * @param songTitle The song title.
   * @param userAnswer The user's answer.
   * @returns The match percentage.
   */
  function calculateTitleMatchPercentage(
    songTitle: string,
    userAnswer: string,
  ): number {
    const normalizedSongTitle: string = songTitle.toLowerCase();
    const normalizedUserAnswer: string = userAnswer.toLowerCase();
    const matchPercentage: number = parseFloat(
      (similarity(normalizedSongTitle, normalizedUserAnswer) * 100).toFixed(2),
    );

    return matchPercentage;
  }

  /** Calculate the similarity between two strings.
   * @param stringA The first string.
   * @param stringB The second string.
   * @returns The similarity between the two strings.
   */
  function similarity(stringA: string, stringB: string): number {
    const longer: string = stringA.length > stringB.length ? stringA : stringB;
    const shorter: string = stringA.length > stringB.length ? stringB : stringA;
    const longerLength: number = longer.length;

    if (longerLength === 0) return 1.0;
    else
      return (
        (longerLength - editDistance(longer, shorter)) /
        parseFloat(longerLength.toString())
      );
  }

  /** Calculate the edit distance between two strings.
   * @param stringA The first string.
   * @param stringB The second string.
   * @returns The edit distance between the two strings.
   */
  function editDistance(stringA: string, stringB: string): number {
    const lowerCaseStringA: string = stringA.toLowerCase();
    const lowerCaseStringB: string = stringB.toLowerCase();

    const costs = new Array<number>();

    for (let i = 0; i <= lowerCaseStringA.length; i++) {
      let lastValue: number = i;

      for (let j = 0; j <= lowerCaseStringB.length; j++) {
        if (i === 0) costs[j] = j;
        else if (j > 0) {
          let newValue: number = costs[j - 1]!;

          if (lowerCaseStringA.charAt(i - 1) !== lowerCaseStringB.charAt(j - 1))
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]!) + 1;

          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }

      if (i > 0) {
        costs[lowerCaseStringB.length] = lastValue;
      }
    }

    return costs[lowerCaseStringB.length]!;
  }

  /** Check if the user's answer matches the music title.
   * @param answer The user's answer.
   * @returns `true` if the user's answer matches the music title, `false` otherwise.
   */
  function checkMusicTitle(answer: string): boolean {
    if (playingTrack && musicTitleFound === "") {
      const matchPercentage: number = calculateTitleMatchPercentage(
        playingTrack.name,
        answer,
      );

      if (matchPercentage >= 80) {
        setMusicTitleFound(playingTrack.name);
        return true;
      }
    }
    return false;
  }

  /** Get the number of artists found in the user's answer.
   * @param answer The user's answer.
   * @returns The number of artists found in the user's answer.
   */
  function getArtistsFoundNumber(answer: string): number {
    if (playingTrack) {
      const artists: string[] = playingTrack.artists.map(
        (artist: any) => artist.name,
      );
      const normalizedAnswer: string = answer.toLowerCase();
      const matchingArtists: string[] = artists.filter((artist) =>
        normalizedAnswer.includes(artist.toLowerCase()),
      );
      const newArtistsFound: string[] = matchingArtists.filter(
        (artist) => !artistsFound.includes(artist),
      );

      console.log("New artists found:", newArtistsFound);

      if (newArtistsFound.length > 0) {
        setArtistsFound((prevArtists) => [...prevArtists, ...newArtistsFound]);
        setArtistsFoundNumber(
          (prevNumber) => prevNumber + matchingArtists.length,
        );
      }

      return newArtistsFound.length;
    } else return 0;
  }

  return (
    <NextUIProvider className="min-h-screen bg-zinc-900 font-mono text-white">
      <Head>
        <title>Blind Test Spotify</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar className="bg-purple-500" isBlurred={true}>
        <NavbarContent justify="start">
          <NavbarItem>
            <p className="text-lg text-white">Blind Test Spotify</p>
          </NavbarItem>
        </NavbarContent>
        <NavbarContent justify="end">
          {session?.data && (
            <NavbarItem className="flex items-center gap-3">
              <Dropdown>
                <DropdownTrigger>
                  <Button className="bg-purple-200 py-6">
                    <User
                      avatarProps={{ src: session?.data?.user.image ?? "" }}
                      name={session?.data?.user.name ?? ""}
                    />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu>
                  <DropdownItem
                    key="signout"
                    color="danger"
                    onClick={() => signOut()}
                  >
                    <p>Déconnexion</p>
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </NavbarItem>
          )}
        </NavbarContent>
      </Navbar>

      <main className="flex h-max flex-grow flex-col">
        <div className="flex flex-col items-center justify-center space-y-4">
          {!playingTrack && (
            <div className="mb-40 flex flex-col items-center justify-center space-y-4">
              <p className="my-20 text-center text-2xl font-bold">
                Veuillez vous connecter avec Spotify pour commencer à jouer.
              </p>
              <Button
                color="success"
                onClick={() => signIn("spotify")}
                disabled={session.status === "loading"}
                startContent={spotifyLogo}
              >
                <p className="font-semibold text-black">Connexion</p>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-grow flex-col items-center justify-center space-y-4">
          {playingTrack && (
            <div className="mx-auto mt-20">
              <img
                src={playingTrack?.album.images[0]?.url} // Assuming the first image of the album is used
                alt={`Album cover for ${playingTrack.name}`}
                className="m-auto h-80 w-80 rounded-lg"
              />
              <ReactPlayer
                url={playingTrack.preview_url}
                playing={true}
                controls={true}
                volume={1}
                width={320}
                height={50}
                className="mb-5 mt-10"
              />
            </div>
          )}
        </div>
        <div>
          {playingTrack && (
            <div className="flex flex-col items-center space-y-2 p-5 text-white">
              <div className="mb-5 flex flex-col items-center">
                <p>Score : {score}</p>
                <p>
                  Artists : {artistsFoundNumber}/{totalArtistsNumber}
                </p>
                <p>Titre : {musicTitleFound !== "" ? musicTitleFound : "?"}</p>
              </div>
              <form>
                <Input
                  type="text"
                  variant="bordered"
                  defaultValue="Réponse"
                  onChange={handleAnswerChange}
                  value={userAnswer}
                  className="w-80"
                />
                <div className="flex flex-row justify-center">
                  <Button
                    type="button"
                    onClick={handleSubmitAnswer}
                    className="mx-2 my-4 rounded bg-purple-500 px-4 py-2 text-lg text-white"
                  >
                    Soumettre
                  </Button>

                  <Button
                    type="button"
                    onClick={() =>
                      getRandomSongFromLibrary(session, setPlayingTrack)
                    }
                    className="mx-2 my-4 rounded bg-purple-500 px-4 py-2 text-lg text-white"
                  >
                    Passer
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </NextUIProvider>
  );
};

export default Home;
