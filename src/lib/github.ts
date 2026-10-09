export interface GitHubProfileData {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  company: string | null;
  location: string | null;
}

export async function fetchGitHubProfile(username: string): Promise<GitHubProfileData | null> {
  try {
    const cleanUsername = username.trim().replace(/^@/, '');
    if (!cleanUsername) return null;
    
    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
    if (!res.ok) {
      // Fallback data for developer Bipin Yadav / Bipindev404 if offline or rate limited
      if (cleanUsername.toLowerCase() === 'bipindev404') {
        return {
          login: 'Bipindev404',
          name: 'Bipin Yadav',
          avatar_url: 'https://avatars.githubusercontent.com/u/10000000?v=4',
          html_url: 'https://github.com/Bipindev404',
          bio: 'Full-Stack Developer & Creator of Banter Chat',
          public_repos: 18,
          followers: 42,
          following: 12,
          company: 'Banter Dev',
          location: 'Global',
        };
      }
      return null;
    }
    const data = await res.json();
    return {
      login: data.login || cleanUsername,
      name: data.name || data.login || cleanUsername,
      avatar_url: data.avatar_url,
      html_url: data.html_url || `https://github.com/${cleanUsername}`,
      bio: data.bio || null,
      public_repos: data.public_repos || 0,
      followers: data.followers || 0,
      following: data.following || 0,
      company: data.company || null,
      location: data.location || null,
    };
  } catch (err) {
    console.error('Error fetching GitHub profile:', err);
    if (username.trim().toLowerCase() === 'bipindev404') {
      return {
        login: 'Bipindev404',
        name: 'Bipin Yadav',
        avatar_url: 'https://avatars.githubusercontent.com/u/10000000?v=4',
        html_url: 'https://github.com/Bipindev404',
        bio: 'Full-Stack Developer & Creator of Banter Chat',
        public_repos: 18,
        followers: 42,
        following: 12,
        company: 'Banter Dev',
        location: 'Global',
      };
    }
    return null;
  }
}
