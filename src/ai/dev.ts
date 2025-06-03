
import { config } from 'dotenv';
config();

import '@/ai/flows/intro-message.ts';
import '@/ai/flows/generate-project-image-flow.ts';
import '@/ai/flows/recognize-handwriting-flow.ts';
import '@/ai/flows/project-qna-flow.ts'; // Added new flow
