/**
 * Module used to persist user rules editor content
 * during switches between common and fullscreen modes
 */
class EditorStorage {
    content = null;

    setContent = (content) => {
        this.content = content;
    };

    getContent = () => {
        return this.content;
    };
}

export const editorStorage = new EditorStorage();
