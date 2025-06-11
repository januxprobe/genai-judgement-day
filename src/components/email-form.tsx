
"use client";

import React, { useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import NeonButton from './neon-button';
import { useToast } from "@/hooks/use-toast";
import { Mail } from 'lucide-react';

const emailFormSchema = z.object({
  companyEmail: z.string().email({ message: "Invalid email address format." }).min(1, { message: "Email is required." }),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface EmailFormProps {
    className?: string;
}

const EmailForm: React.FC<EmailFormProps> = ({ className }) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      companyEmail: '',
    },
  });

  const onSubmit: SubmitHandler<EmailFormValues> = (data) => {
    const performSubmitActions = () => {
      console.log('Company Email Submitted:', data.companyEmail);
      toast({
        title: "Transmission Received",
        description: `Thank you. Your verdict for ${data.companyEmail} will be logged.`,
      });
      form.reset();
    };

    if (audioRef.current) {
      const audioElement = audioRef.current;

      // Ensure listeners from previous attempts are cleared
      const newAudioElement = audioElement.cloneNode(true) as HTMLAudioElement;
      audioRef.current = newAudioElement; // Update ref if needed, though direct manipulation is fine

      const handleAudioEndOrError = () => {
        newAudioElement.removeEventListener('ended', handleAudioEndOrError);
        newAudioElement.removeEventListener('error', audioErrorListener);
        performSubmitActions();
      };
      
      const audioErrorListener = (event: Event) => {
        console.error("Audio element error event:", event);
        handleAudioEndOrError();
      };

      newAudioElement.addEventListener('ended', handleAudioEndOrError);
      newAudioElement.addEventListener('error', audioErrorListener);
      
      newAudioElement.load(); // Important to load before play
      newAudioElement.play().catch(error => {
        console.error("Audio play() promise rejected for ill-be-back.mp3:", error);
        // Call handler directly if play() promise itself rejects
        // (e.g. browser interrupted, no user interaction, etc.)
        handleAudioEndOrError();
      });
    } else {
      performSubmitActions(); // Audio ref not found or audio not supported
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={`space-y-6 ${className}`}>
        <FormField
          control={form.control}
          name="companyEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xl neon-text-secondary uppercase">Enter Your Company Email:</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="name@company.com" 
                  {...field} 
                  className="bg-input border-primary text-foreground placeholder:text-muted-foreground focus:ring-secondary text-lg py-6 px-4"
                />
              </FormControl>
              <FormMessage className="text-destructive neon-text-primary" />
            </FormItem>
          )}
        />
        <NeonButton type="submit" neonColor="primary" className="w-full" disabled={form.formState.isSubmitting}>
          <Mail className="mr-2 h-6 w-6" />
          {form.formState.isSubmitting ? "TRANSMITTING..." : "RECEIVE YOUR VERDICT"}
        </NeonButton>
      </form>
      {/* 
        The audio element is referenced. Using a key here could also help ensure it's "fresh" 
        if there were issues with re-using the same element, but cloning and re-adding listeners 
        in the handler is a more direct approach for this specific scenario.
      */}
      <audio ref={audioRef} src="/assets/audio/ill-be-back.mp3" preload="auto" />
    </Form>
  );
};

export default EmailForm;
