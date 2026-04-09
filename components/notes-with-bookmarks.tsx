'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bookmark, Plus, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  content: string;
  isBookmarked: boolean;
  createdAt: string;
  keypoints?: Keypoint[];
}

interface Keypoint {
  id: string;
  title: string;
  description: string;
  importanceLevel: 'low' | 'medium' | 'high';
}

interface NotesWithBookmarksProps {
  initialNotes?: Note[];
  videoId: string;
  onSaveNote?: (note: Note) => void;
}

export function NotesWithBookmarks({ initialNotes = [], videoId, onSaveNote }: NotesWithBookmarksProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKeypoint, setNewKeypoint] = useState<{ noteId: string; title: string; description: string; level: string } | null>(null);

  const toggleBookmark = async (noteId: string) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    setIsLoading(true);
    setError(null);

    try {
      // Here you would call your API to update the note
      const updatedNotes = notes.map((n) => (n.id === noteId ? { ...n, isBookmarked: !n.isBookmarked } : n));
      setNotes(updatedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update bookmark');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedNotes = notes.filter((n) => n.id !== noteId);
      setNotes(updatedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete note');
    } finally {
      setIsLoading(false);
    }
  };

  const addKeypoint = async (noteId: string, keypointData: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedNotes = notes.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            keypoints: [
              ...(n.keypoints || []),
              {
                id: `kp-${Date.now()}`,
                ...keypointData,
              },
            ],
          };
        }
        return n;
      });
      setNotes(updatedNotes);
      setNewKeypoint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add keypoint');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {notes.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="group hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Note</CardTitle>
                    <CardDescription>{new Date(note.createdAt).toLocaleString()}</CardDescription>
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleBookmark(note.id)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0"
                    >
                      {note.isBookmarked ? (
                        <Bookmark className="h-4 w-4 fill-current text-yellow-500" />
                      ) : (
                        <Bookmark className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      disabled={isLoading}
                      className="h-8 w-8 p-0 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-foreground whitespace-pre-wrap">{note.content}</p>

                {/* Keypoints Section */}
                {note.keypoints && note.keypoints.length > 0 && (
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-sm">Key Points</h4>
                    <div className="space-y-2">
                      {note.keypoints.map((kp) => (
                        <motion.div
                          key={kp.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="p-3 rounded-lg bg-secondary/50 border border-primary/20"
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                                kp.importanceLevel === 'high'
                                  ? 'bg-red-500'
                                  : kp.importanceLevel === 'medium'
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                            />
                            <div className="flex-1">
                              <p className="font-semibold text-sm">{kp.title}</p>
                              <p className="text-xs text-muted-foreground">{kp.description}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Keypoint Form */}
                {newKeypoint?.noteId === note.id ? (
                  <div className="space-y-2 border-t pt-4">
                    <input
                      type="text"
                      placeholder="Keypoint title"
                      value={newKeypoint.title}
                      onChange={(e) => setNewKeypoint({ ...newKeypoint, title: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newKeypoint.description}
                      onChange={(e) => setNewKeypoint({ ...newKeypoint, description: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input text-sm"
                    />
                    <select
                      value={newKeypoint.level}
                      onChange={(e) => setNewKeypoint({ ...newKeypoint, level: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-input text-sm"
                    >
                      <option value="low">Low Importance</option>
                      <option value="medium">Medium Importance</option>
                      <option value="high">High Importance</option>
                    </select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() =>
                          addKeypoint(note.id, {
                            title: newKeypoint.title,
                            description: newKeypoint.description,
                            importanceLevel: newKeypoint.level,
                          })
                        }
                        disabled={isLoading || !newKeypoint.title}
                      >
                        Add
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setNewKeypoint(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setNewKeypoint({ noteId: note.id, title: '', description: '', level: 'medium' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Key Point
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {notes.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No notes yet. Generate notes from a video to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
