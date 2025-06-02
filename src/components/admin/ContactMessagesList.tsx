
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase/firebase';
import { collection, query, orderBy, getDocs, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Trash2, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}

export default function ContactMessagesList() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [messageToDelete, setMessageToDelete] = useState<ContactMessage | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const messagesCollection = collection(db, 'contactMessages');
      const q = query(messagesCollection, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const fetchedMessages: ContactMessage[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          name: data.name,
          email: data.email,
          message: data.message,
          createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
          isRead: data.isRead || false,
        });
      });
      setMessages(fetchedMessages);
    } catch (err) {
      console.error("Error fetching contact messages:", err);
      const errorMessage = err instanceof Error ? err.message : 'Could not load messages.';
      setError(errorMessage);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const toggleReadStatus = async (messageId: string, currentStatus: boolean) => {
    try {
      const messageRef = doc(db, 'contactMessages', messageId);
      await updateDoc(messageRef, { isRead: !currentStatus });
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, isRead: !currentStatus } : msg
        )
      );
      toast({
        title: `Message marked as ${!currentStatus ? 'read' : 'unread'}.`,
      });
    } catch (err) {
      console.error("Error updating read status:", err);
      toast({ title: "Error", description: "Could not update message status.", variant: "destructive" });
    }
  };

  const openDeleteDialog = (message: ContactMessage) => {
    setMessageToDelete(message);
    setShowDeleteDialog(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'contactMessages', messageToDelete.id));
      toast({
        title: "Message Deleted",
        description: `Message from ${messageToDelete.name} has been deleted.`,
      });
      fetchMessages(); // Refresh the list
      setShowDeleteDialog(false);
    } catch (err) {
      console.error("Error deleting message:", err);
      toast({ title: "Error", description: "Could not delete message.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Loading messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-10">
        <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
        <p>{error}</p>
        <Button onClick={fetchMessages} variant="outline" className="mt-4">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  if (messages.length === 0) {
    return <p className="text-muted-foreground text-center py-10">No messages yet.</p>;
  }

  return (
    <div className="space-y-4">
       <Button onClick={fetchMessages} variant="outline" size="sm" className="mb-4">
          <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} /> Refresh Messages
        </Button>
      {messages.map((msg) => (
        <Card key={msg.id} className={cn("transition-all", msg.isRead ? "bg-muted/20 border-border/50" : "bg-card border-primary/30")}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className={cn("text-lg", !msg.isRead && "text-primary")}>{msg.name}</CardTitle>
                <CardDescription>
                  <a href={`mailto:${msg.email}`} className="hover:underline text-primary/80">{msg.email}</a>
                </CardDescription>
              </div>
              <span className="text-xs text-muted-foreground pt-1">
                {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleReadStatus(msg.id, msg.isRead)}
              className="hover:bg-accent/80"
            >
              {msg.isRead ? <EyeOff className="mr-1 h-4 w-4" /> : <Eye className="mr-1 h-4 w-4" />}
              {msg.isRead ? 'Mark Unread' : 'Mark Read'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openDeleteDialog(msg)}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
      {messageToDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the message from "{messageToDelete.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setShowDeleteDialog(false)} disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDeleteMessage} disabled={isDeleting} className={cn(isDeleting && "bg-destructive/80")}>
                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
