import { copyWar } from '@adguard/tswebextension/cli';

export const copyExternals = async () => {
    await copyWar('Extension/web-accessible-resources');
};
