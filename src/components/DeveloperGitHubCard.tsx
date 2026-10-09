import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, Code2 } from 'lucide-react';
import { fetchGitHubProfile, GitHubProfileData } from '../lib/github';

interface DeveloperGitHubCardProps {
  username?: string;
  className?: string;
  isDarkMode?: boolean;
}

export const DeveloperGitHubCard: React.FC<DeveloperGitHubCardProps> = ({
  username = 'Bipindev404',
  className = '',
  isDarkMode = true,
}) => {
  const [profile, setProfile] = useState<GitHubProfileData | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchGitHubProfile(username).then((data) => {
      if (isMounted && data) {
        setProfile(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [username]);

  const profileUrl = profile?.html_url || `https://github.com/${username}`;
  const avatarUrl = profile?.avatar_url || `https://github.com/${username}.png`;
  const devName = profile?.name || 'Bipin Yadav';
  const handle = profile?.login || username;
  const bio = profile?.bio || 'Full-Stack Developer & Creator of Banter';

  return (
    <div
      className={`p-4 rounded-2xl border relative overflow-hidden transition-all ${
        isDarkMode
          ? 'bg-white/[0.04] border-white/10 text-white'
          : 'bg-neutral-100/80 border-black/10 text-neutral-900 shadow-xs'
      } ${className}`}
    >
      {/* Top subtle glow bar */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent pointer-events-none" />

      {/* Header Label */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[#007AFF]/20 text-[#007AFF] flex items-center justify-center">
            <Github className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
            Developer
          </span>
        </div>

        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#007AFF] hover:underline"
        >
          <span>@{handle}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Profile Info - Profile Pic & Details only */}
      <div className="flex items-center gap-3.5">
        {/* GitHub Profile Picture */}
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative shrink-0 group"
        >
          <img
            src={avatarUrl}
            alt={devName}
            className={`w-12 h-12 rounded-2xl border object-cover shadow-md group-hover:scale-105 transition-transform ${
              isDarkMode ? 'border-white/20 bg-neutral-800' : 'border-black/10 bg-neutral-200'
            }`}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                devName
              )}&background=007AFF&color=fff`;
            }}
          />
        </a>

        {/* Developer Bio & Name */}
        <div className="min-w-0 flex-1">
          <h4 className={`text-sm font-extrabold truncate ${isDarkMode ? 'text-white' : 'text-neutral-900'}`}>
            {devName}
          </h4>
          <p className={`text-xs leading-snug mt-0.5 line-clamp-2 ${isDarkMode ? 'text-neutral-300' : 'text-neutral-600'}`}>
            {bio}
          </p>
        </div>
      </div>
    </div>
  );
};
