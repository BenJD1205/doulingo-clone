'use client'
import { useState, useTransition } from 'react'
import { toast } from 'sonner';
import { challenges, challengeOptions } from "@/db/schema"
import { Header } from './header';
import { Challenge } from './challenge';
import { QuestionBubble } from './question-bubble';
import { Footer } from './footer';
import { upsertChallengeProgress } from '@/actions/challenge-progress';

type Props = {
    initialPercentage: number;
    initialHearts: number;
    initialLessonId: number;
    initialLessonChallenges: (typeof challenges.$inferSelect & {
        completed: boolean;
        challengeOptions: typeof challengeOptions.$inferSelect[];
    })[];
    userSubscription: any //TODO: Replace with subscription DB type
}

export const Quiz = ({
    initialPercentage,
    initialHearts,
    initialLessonId,
    initialLessonChallenges,
    userSubscription,
}: Props) => {
    const [pending, startTransition] = useTransition()
    const [hearts, setHearts] = useState(initialHearts);
    const [percentage, setPercentage] = useState(() => {
        return initialPercentage === 100 ? 0 : initialPercentage;
    });
    const [challenges] = useState(initialLessonChallenges);
    const [activeIndex, setActiveIndex] = useState(() => {
    const uncompletedIndex = challenges.findIndex((challenge) => !challenge.completed);
        return uncompletedIndex === -1 ? 0 : uncompletedIndex;
    });
    const [selectedOption, setSelectedOption] = useState<number>()
    const [status, setStatus] = useState<"correct" | "none" | "wrong">("none")

    const challenge = challenges[activeIndex];
    const options = challenge?.challengeOptions ?? [];
    
    const onSelect = (id: number) => {
        if (status !== "none") return;
        setSelectedOption(id);
    }
    
    const onNext = () => {
        setActiveIndex((current) => current + 1)
    }

    const onContinue = () => {
        if (!selectedOption) return;

        if(status === 'wrong'){
            setStatus("none");
            setSelectedOption(undefined)
            return;
        }

        if (status === 'correct') {
            onNext();
            setStatus('none')
            setSelectedOption(undefined)
            return;
        }
        const correctOption = options.find((option) => option.correct)
        if (!correctOption) return;
        if(correctOption && correctOption.id === selectedOption){
            startTransition(() => {
                upsertChallengeProgress(challenge.id)
                .then((response) => {
                    if (response?.error === "hearts") {
                        return;
                    }

                    setStatus("correct");
                    setPercentage((prev) => prev + 100 / challenges.length);

                    // This is a practice
                    if (initialPercentage === 100) {
                    setHearts((prev) => Math.min(prev + 1, 5));
                    }
                })
                .catch(() => toast.error("Something went wrong. Please try again."))
            });
        }else{
            console.error("Incorrect option!")
        }
    }


    const title = challenge.type === "ASSIST" 
    ? "Select the correct meaning"
    : challenge.question;


    return <>
        <Header hearts={hearts} percentage={percentage} hasActiveSubscription={!!userSubscription?.isActive} />
        <div className='flex-1'>
            <div className='h-full flex items-center justify-center'>
                <div className='lg:min-h-[350px] lg:w-[600px] w-full px-6 lg:px-0 flex flex-col gap-y-12'>
                    <h1 className='text-lg lg:text-3xl text-center lg:-text-start font-bold text-neutral-700'>
                        {title}
                    </h1>
                    <div>
                        {/* TODO: Change back to type ASSIST*/}
                        {challenge.type === 'SELECT' && (
                            <QuestionBubble question={challenge.question} />
                        )}
                        <Challenge
                            options={options}
                            onSelect={onSelect}
                            status={status}
                            selectedOption={selectedOption}
                            disabled={false}
                            type={challenge.type}
                        />
                    </div>
                </div>
            </div>
        </div>
        <Footer
            disabled={pending || !selectedOption}
            status={status}
            onCheck={onContinue}
        />
    </>
}