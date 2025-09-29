export interface User {
  _id: string;
  username: 'Tino' | 'Misho' | 'Tedak';
  name: string;
  avatar: string;
  isAdmin: boolean;
  createdAt: string;
}

export interface Band {
  _id: string;
  name: string;
  image: string;
  spotifyId?: string;
  lastFmId?: string;
  musicBrainzId?: string;
  addedBy: string;
  createdAt: string;
}

export interface Group {
  _id: string;
  name: string;
  description?: string;
  members: string[];
  createdAt: string;
}

export interface Vote {
  _id: string;
  voteNumber: number;
  status: 'pending' | 'active' | 'runoff' | 'rating' | 'completed';
  availableBands: Band[];
  userVotes: UserVote[];
  winner?: Band;
  results: VoteResult[];
  ratings: Rating[];
  averageRating: number;
  createdAt: string;
  completedAt?: string;
}

export interface Rating {
  userId: string;
  score: number;
  submittedAt: string;
}

export interface UserVote {
  userId: string;
  selectedBands: {
    bandId: string;
    rank: number;
  }[];
  submittedAt: string;
}

export interface VoteResult {
  bandId: string;
  voteCount: number;
}

export interface UserContextType {
  user: User | null;
  selectUser: (username: 'Tino' | 'Misho' | 'Tedak') => Promise<void>;
  logout: () => void;
  loading: boolean;
}