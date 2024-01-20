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

    // Utilisez le composant ReactPlayer pour jouer la musique
    setPlayingTrack(randomTrack);

  } catch (error) {
    console.error('Error fetching user library:', error.response?.data || error.message);
    // Handle errors accordingly.
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
    // Comparez la réponse proposée avec le nom de la chanson en cours
    if (playingTrack && userAnswer.toLowerCase() === playingTrack.name.toLowerCase()) {
      // Réponse correcte, ajoutez 100 points au score
      setScore(score + 100);

      // Changez la musique
      getRandomSongFromLibrary(session, setPlayingTrack);

      // Effacez la réponse précédente
      setUserAnswer('');
      console.log("Réponse ok")
    } else {
      // Réponse incorrecte, vous pouvez gérer cela en conséquence
      console.log('Réponse incorrecte, essayez à nouveau.'+userAnswer.toLowerCase()+"-"+playingTrack.name.toLowerCase());
    }
  };

  return (
    <div >
      <Head>
        <title>SpotiGame</title>
        <meta name="description" content="" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1>
          BONJOUR,{' '}
          {session.status === 'authenticated'
            ? session.data.user?.name || 'friend'
            : 'étranger'}
          !
        </h1>
        <p>
          {session.status === 'authenticated' ? (
            <>
              <button
                type="button"
                onClick={() => signOut()}
              >
                Sign out {session.data.user?.email}
              </button>
              
              {playingTrack && (
                <ReactPlayer
                  url={playingTrack.preview_url} // ou tout autre URL audio
                  playing={true}
                  controls={true}
                  volume={1}
                />
              )}
            </>
          ) : (
            <button
              type="button"
              style={{ '--accent-color': '#15883e' }}
              onClick={() => signIn('spotify')}
              disabled={session.status === 'loading'}
            >
              Connexion avec Spotify
            </button>
          )}
        </p>
        {playingTrack && (
          <>
            <button
                type="button"
                onClick={() => getRandomSongFromLibrary(session, setPlayingTrack)}
              >
                Passer
            </button>
            <form>
              <label>
                Réponse:
                <input type="text" value={userAnswer} onChange={handleAnswerChange} />
              </label>
              <button type="button" onClick={handleSubmitAnswer}>
                Soumettre
              </button>
            </form>
          </>
        )}
      </main>
    </div>
  );
};

export default Home;
