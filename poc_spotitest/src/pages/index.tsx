import type { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';

const SPOTIFY_LIBRARY_ENDPOINT = 'https://api.spotify.com/v1/me/tracks';

const Home: NextPage = () => {
  const session = useSession();
  const [playingTrack, setPlayingTrack] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [artistsFoundNumber, setArtistsFoundNumber] = useState(0);
  const [artistsFound, setArtistsFound] = useState([] as string[]);
  const [totalArtistsNumber, setTotalArtistsNumber] = useState(0);
  const [musicTitleFound, setMusicTitleFound] = useState('');

  useEffect(() => {
    if (session.status === 'authenticated') {
      getRandomSongFromLibrary(session, setPlayingTrack);
    }
  }, [session]);

  async function getRandomSongFromLibrary(session: any, setPlayingTrack: Function) {
    try {
      const accessToken = session.data.user.accessToken;
  
      const response = await axios.get(SPOTIFY_LIBRARY_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
  
      const tracks = response.data.items.map((item: any) => item.track);
  
      if (tracks.length === 0) {
        console.log('User has no tracks in their library.');
        return;
      }
  
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
  
      console.log('Random Track:', {
        name: randomTrack.name,
        artist: randomTrack.artists.map((artist: any) => artist.name).join(', '),
        uri: randomTrack.uri,
      });
  
      setPlayingTrack(randomTrack);
  
      initMusicStats(randomTrack);
  
    } catch (error) {
      console.error('Error fetching user library:', error.response?.data || error.message);
    }
  }

  function initMusicStats(randomTrack) { //TODO: créer une interface pour randomTrack
    setArtistsFound([]);
    setArtistsFoundNumber(0);
    setMusicTitleFound('');
    setTotalArtistsNumber(randomTrack.artists.length || 0);
  }

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };

  const handleSubmitAnswer = () => {
    handleAnswer(userAnswer);
    
    if(checkEndGame())
      getRandomSongFromLibrary(session, setPlayingTrack);

  };

  function checkEndGame(): boolean {
    return (artistsFoundNumber === totalArtistsNumber && musicTitleFound !== '');
  }

  function handleAnswer(answer: string) {
    if(!playingTrack) return;

    if(checkMusicTitle(answer)) {
      console.log('Title found:', playingTrack.name);
      
      setScore(score + 100);
    }
    else {
      const artistsFound = getArtistsFoundNumber(answer);
      const artistsNumber = playingTrack.artists.length;
      const artistsPercentage = (artistsFound / artistsNumber) * 100;
      
      if(artistsFound > 0) {
        console.log('Artists found:', artistsFound, '/', artistsNumber, '(', artistsPercentage, '%)');
        
        setScore(score + artistsPercentage);
      }
    }
  }

  function calculateTitleMatchPercentage(songTitle: string, userAnswer: string): number {
    const normalizedSongTitle: string = songTitle.toLowerCase();
    const normalizedUserAnswer: string = userAnswer.toLowerCase();
  
    const matchPercentage: number = parseFloat((similarity(normalizedSongTitle, normalizedUserAnswer) * 100).toFixed(2));
  
    return matchPercentage;
  }

  function similarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    const longerLength = longer.length;

    if (longerLength === 0) {
      return 1.0;
    }

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength.toString());
  }

  function editDistance(stringA: string, stringB: string): number {
    const lowerCaseStringA: string = stringA.toLowerCase();
    const lowerCaseStringB: string = stringB.toLowerCase();

    const costs = new Array<number>();

    for (let i = 0; i <= lowerCaseStringA.length; i++) {
      let lastValue: number = i;

      for (let j = 0; j <= lowerCaseStringB.length; j++) {
        if (i === 0)
          costs[j] = j;

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

  function checkMusicTitle(answer: string): boolean {
    if (playingTrack && musicTitleFound === '') {
      const matchPercentage: number = calculateTitleMatchPercentage(playingTrack.name, answer);

      if (matchPercentage >= 80) {
        setMusicTitleFound(playingTrack.name);
        return true;
      }
    }
    return false;
  }

  function getArtistsFoundNumber(answer: string): number {
    if (playingTrack) {
      const artists: string[] = playingTrack.artists.map((artist: any) => artist.name);
  
      const normalizedAnswer: string = answer.toLowerCase();
  
      const matchingArtists: string[] = artists.filter((artist) => normalizedAnswer.includes(artist.toLowerCase()));

      const newArtistsFound: string[] = matchingArtists.filter((artist) => !artistsFound.includes(artist));

      console.log('New artists found:', newArtistsFound);

      if(newArtistsFound.length > 0) {
        setArtistsFound((prevArtists) => [...prevArtists, ...newArtistsFound]);
        setArtistsFoundNumber((prevNumber) => prevNumber + matchingArtists.length);
      }

      return newArtistsFound.length;
    } 
    else
      return 0;
  }
  

  return (
    <div className="flex flex-col h-screen">
      <Head>
        <title>SpotiGame</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

 <main className="flex-grow flex flex-col">
        <div className="bg-gray-800 p-4 flex justify-between items-center">

          <h1 className="text-white text-lg">
            BONJOUR !{' '}
            {session.status === 'authenticated'
              ? session.data.user?.name || ''
              : 'Veuillez vous connecter'}
          </h1>
          <div>
            {session.status === 'authenticated' ? (
              <>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="bg-gray-200 text-black px-2 py-1 rounded"
                >
                  Déconnexion {session.data.user?.email}
                </button>

                
              </>
            ) : (
              <button
                type="button"
                onClick={() => signIn('spotify')}
                disabled={session.status === 'loading'}
                className="bg-gray-200 text-black px-2 py-1 rounded"
              >
                Connexion avec Spotify
              </button>
            )}
          </div>
        </div>

        <div className="bg-gray-300 flex flex-col items-center justify-center space-y-4 flex-grow">
          {playingTrack && (
            <div className="mx-auto">
              <img
                src={playingTrack.album.images[0].url} // Assuming the first image of the album is used
                alt={`Album cover for ${playingTrack.name}`}
                className="m-auto w-80 h-80"
              />
              <ReactPlayer
                url={playingTrack.preview_url}
                playing={true}
                controls={true}
                volume={1}
                className="h-20"
              />
            </div>
          )}
        </div>
        <div className="bg-gray-200">
          {playingTrack && (
 
          <div className="flex flex-col items-center space-y-2 p-5">
                <p>Score : {score}</p>
                <p>Artists : {artistsFoundNumber}/{totalArtistsNumber}</p>
                <p>Titre : {musicTitleFound}</p>
                <form>
                  <label className="text-lg mx-2">
                    Votre proposition :
                    <input
                      type="text"
                      value={userAnswer}
                      onChange={handleAnswerChange}
                      className="border border-gray-300 px-2 py-1 mx-2 rounded"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    className="bg-gray-500 text-white px-4 py-2 mx-2 rounded"
                  >
                    Soumettre
                  </button>

                  <button
                    type="button"
                    onClick={() => getRandomSongFromLibrary(session, setPlayingTrack)}
                    className="bg-gray-500 text-white px-4 py-2 mx-2 rounded"
                  > 
                    Passer
                  </button>
                </form>
              </div>
              
          )}
        </div>

      </main>
    </div>
  );

};

export default Home;
