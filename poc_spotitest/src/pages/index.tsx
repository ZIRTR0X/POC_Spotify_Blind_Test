import type { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';
import Head from 'next/head';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPlayer from 'react-player';

const SPOTIFY_LIBRARY_ENDPOINT = 'https://api.spotify.com/v1/me/tracks';

const getRandomSongFromLibrary = async (session: any, setPlayingTrack: Function) => {
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

  } catch (error) {
    console.error('Error fetching user library:', error.response?.data || error.message);
  }
};

const Home: NextPage = () => {
  const session = useSession();
  const [playingTrack, setPlayingTrack] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (session.status === 'authenticated') {
      getRandomSongFromLibrary(session, setPlayingTrack);
    }
  }, [session]);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };

  const handleSubmitAnswer = () => {
    if (playingTrack && userAnswer.toLowerCase() === playingTrack.name.toLowerCase()) {
      setScore(score + 100);

      getRandomSongFromLibrary(session, setPlayingTrack);

      setUserAnswer('');
      console.log("Réponse ok")
    } else {
      setScore(score + 10);
      console.log('Réponse incorrecte, essayez à nouveau.'+userAnswer.toLowerCase()+"-"+playingTrack.name.toLowerCase());
    }
  };

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
                <h1> Score : {score}</h1>
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
