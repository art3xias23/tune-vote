export interface User {
  _id: string;
  username: 'Tino' | 'Misho' | 'Tedak';
  name: string;
  avatar: string;
  description: string;
  isAdmin?: boolean;
  createdAt: string;
}

export interface Band {
  _id: string;
  name: string;
  image: string;
  spotifyId?: string;
  lastFmId?: string;
  musicBrainzId?: string;
  createdAt: string;
}

export interface UserVote {
  userId: string;
  selectedBands: string[];
}

export interface Rating {
  userId: string;
  score: number;
}

export interface Vote {
  _id: string;
  voteNumber: number;
  creator: string;
  status: 'active' | 'completed' | 'runoff' | 'rating';
  participants: string[];
  selectedBands: { [userId: string]: string[] };
  winner?: Band;
  ratings: Rating[];
  userVotes: UserVote[];
  availableBands: Band[];
  results: { bandId: string; votes: number; percentage: number }[];
  averageRating: number;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserContextType {
  user: User | null;
  selectUser: (username: 'Tino' | 'Misho' | 'Tedak') => Promise<void>;
  logout: () => void;
  loading: boolean;
}