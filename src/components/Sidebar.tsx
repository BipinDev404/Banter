import React from 'react';
import {
  Music,
  Disc,
  Mic2,
  ListMusic,
  Heart,
  FolderTree,
  Sparkles,
  BarChart3,
  Sliders,
  Settings,
  HelpCircle,
  PlusCircle,
  Zap,
} from 'lucide-react';
import { ViewSection } from '../types';
import { useAudio } from '../context/AudioContext';

interface SidebarProps {
  activeSection: ViewSection;
  setActiveSection: (section: ViewSection) => void;
  activePlaylistId: string | null;
  setActivePlaylistId: (id: string | null) => void;
  onOpenCreatePlaylist: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  setActiveSection,
  activePlaylistId,
  setActivePlaylistId,
  onOpenCreatePlaylist,
}) => {
  const { songs, playlists, setIsEqualizerOpen, setIsShortcutsOpen, loadDemoSongs } = useAudio();

  const mainNavItems = [
    { id: 'songs' as ViewSection, label: 'All Songs', icon: Music, count: songs.length },
    { id: 'albums' as ViewSection, label: 'Albums', icon: Disc },
    { id: 'artists' as ViewSection, label: 'Artists', icon: Mic2 },
    { id: 'genres' as ViewSection, label: 'Genres', icon: ListMusic },
    { id: 'folders' as ViewSection, label: 'Folders', icon: FolderTree },
    { id: 'favorites' as ViewSection, label: 'Favorites', icon: Heart, count: songs.filter((s) => s.isFavorite).length },
  ];

  const smartNavItems = [
    { id: 'smart_collections' as ViewSection, label: 'Smart Collections', icon: Sparkles },
    { id: 'insights' as ViewSection, label: 'Your Listening', icon: BarChart3 },
  ];

  const handleSelectSection = (section: ViewSection) => {
    setActiveSection(section);
    setActivePlaylistId(null);
  };

  const handleSelectPlaylist = (id: string) => {
    setActiveSection('playlists');
    setActivePlaylistId(id);
  };

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-800/60 flex flex-col h-full select-none shrink-0 text-zinc-300">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-zinc-900/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20">
            <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-amber-400" />
            </div>
          </div>
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white font-display">Bongs</h1>
            <p className="text-[11px] text-zinc-500 uppercase tracking-widest font-semibold">Offline Music</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {/* Library Navigation */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Library
          </div>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id && !activePlaylistId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      isActive ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-400'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Discovery & Insights */}
        <div>
          <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Discover
          </div>
          <nav className="space-y-1">
            {smartNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id && !activePlaylistId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Playlists */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              Playlists ({playlists.length})
            </span>
            <button
              onClick={onOpenCreatePlaylist}
              className="text-zinc-400 hover:text-amber-400 transition-colors p-1 rounded-md hover:bg-zinc-900"
              title="Create Playlist"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-0.5">
            {playlists.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-600 italic">No playlists created yet</p>
            ) : (
              playlists.map((playlist) => {
                const isActive = activeSection === 'playlists' && activePlaylistId === playlist.id;
                return (
                  <button
                    key={playlist.id}
                    onClick={() => handleSelectPlaylist(playlist.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 truncate flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-300 font-medium'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                    }`}
                  >
                    <span className="truncate">{playlist.name}</span>
                    <span className="text-[11px] text-zinc-600 ml-2">{playlist.songIds.length}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Demo Songs Trigger if empty */}
        {songs.length === 0 && (
          <div className="p-3 bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 rounded-xl border border-amber-500/20 text-center space-y-2">
            <Zap className="w-5 h-5 text-amber-400 mx-auto animate-pulse" />
            <p className="text-xs text-zinc-300 font-medium">Your library is empty.</p>
            <p className="text-[11px] text-zinc-500">Generate high-quality synth demo tracks to test Bongs instantly.</p>
            <button
              onClick={loadDemoSongs}
              className="w-full text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 py-1.5 px-3 rounded-lg transition-colors shadow-md shadow-amber-500/20"
            >
              Load Demo Tracks
            </button>
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="p-3 border-t border-zinc-900/80 bg-zinc-950/90 space-y-1">
        <button
          onClick={() => setIsEqualizerOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-amber-300 hover:bg-zinc-900/80 transition-colors"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Equalizer & Audio Effects</span>
        </button>

        <button
          onClick={() => setIsShortcutsOpen(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 transition-colors"
        >
          <HelpCircle className="w-4 h-4 text-zinc-500" />
          <span>Keyboard Shortcuts</span>
        </button>

        <button
          onClick={() => handleSelectSection('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            activeSection === 'settings'
              ? 'bg-amber-500/10 text-amber-300'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
          }`}
        >
          <Settings className="w-4 h-4 text-zinc-500" />
          <span>App Settings</span>
        </button>
      </div>
    </aside>
  );
};
