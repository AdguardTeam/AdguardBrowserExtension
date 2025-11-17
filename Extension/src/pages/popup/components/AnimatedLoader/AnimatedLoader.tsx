/**
 * Copyright (c) 2015-2025 Adguard Software Ltd.
 *
 * @file
 * This file is part of AdGuard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * AdGuard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * AdGuard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with AdGuard Browser Extension. If not, see <http://www.gnu.org/licenses/>.
 */

import React, {
    useEffect,
    useRef,
    useState,
} from 'react';

import loadingVideo from '../../../../../assets/videos/loading.webm';
import { logger } from '../../../../common/logger';

import './animated-loader.pcss';

/**
 * Minimum time (in ms) to show the loader.
 * If loading completes before this time, skip the loader entirely
 * to prevent unnecessary flashes.
 *
 * 50ms is enough to prevent most flashes without introducing noticeable delay.
 */
const LOADER_MIN_DURATION_MS = 50;

/**
 * Duration of one loop of the video animation in milliseconds.
 * Will be determined from the video's actual duration once loaded.
 */
const DEFAULT_ANIMATION_DURATION_MS = 1800;

type AnimatedLoaderProps = {
    /**
     * Component to render after timeout passes.
     */
    children: JSX.Element;

    /**
     * Flag that indicates whether the application is still loading.
     */
    isLoading: boolean;
};

/**
 * Smart loader wrapper that synchronizes content display with the loading
 * animation's loop cycle.
 *
 * Loading behavior:
 * - Very fast loads (<LOADER_MIN_DURATION_MS): Skip loader entirely to avoid
 *   unnecessary flashes.
 * - Normal loads (≥LOADER_MIN_DURATION_MS): Show loader and wait until
 *   the current animation loop completes before displaying content,
 *   ensuring smooth visual transition.
 *
 * Animation duration is automatically calculated from the Lottie JSON file.
 */
export const AnimatedLoader = ({
    children,
    isLoading,
}: AnimatedLoaderProps) => {
    const [loaded, setLoaded] = useState(false);
    const [waited, setWaited] = useState(false);
    const [fastLoaded, setFastLoaded] = useState(false);

    // Tracker for "fast load" case
    const loadStartTimeRef = useRef<number>(Date.now());
    // Tracker for animation loop timing
    const videoPlayStartTimeRef = useRef<number | null>(null);
    const videoDurationRef = useRef<number>(DEFAULT_ANIMATION_DURATION_MS);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Check fast load case
    useEffect(() => {
        setLoaded(!isLoading);

        if (isLoading) {
            return;
        }

        const elapsedTime = Date.now() - loadStartTimeRef.current;

        // If loaded very quickly (before LOADER_MIN_DURATION_MS), show content
        // immediately.
        if (elapsedTime < LOADER_MIN_DURATION_MS) {
            setFastLoaded(true);
            return;
        }

        // If video hasn't started playing yet, but loading is done,
        // we can consider the loading complete to prevent flickers.
        if (!videoPlayStartTimeRef.current) {
            setWaited(true);
            return;
        }

        const animationDuration = videoDurationRef.current;
        const videoElapsedTime = Date.now() - videoPlayStartTimeRef.current;
        const toNextAnimationLoop = animationDuration - (videoElapsedTime % animationDuration);
        const timer = setTimeout(() => {
            setWaited(true);
        }, toNextAnimationLoop);

        return () => clearTimeout(timer);
    }, [isLoading]);

    const showContent = (loaded && waited) || fastLoaded;

    const handleVideoLoadedMetadata = () => {
        if (!videoRef.current) {
            logger.warn('[ext.AnimatedLoader]: Video ref is null when loading metadata');
            return;
        }

        // Store the video duration in milliseconds
        videoDurationRef.current = videoRef.current.duration * 1000;
        logger.trace('[ext.AnimatedLoader]: Video metadata loaded, duration:', videoDurationRef.current);
    };

    const handleVideoPlay = () => {
        logger.trace('[ext.AnimatedLoader]: Video started playing');
        // Set the timer for when video actually started playing
        videoPlayStartTimeRef.current = Date.now();
    };

    const loader = (
        <div className="animated-loader">
            <video
                ref={videoRef}
                className="animated-loader__video"
                src={loadingVideo}
                autoPlay
                loop
                muted
                playsInline
                onLoadedMetadata={handleVideoLoadedMetadata}
                onPlay={handleVideoPlay}
            />
        </div>
    );
    return showContent ? children : loader;
};
