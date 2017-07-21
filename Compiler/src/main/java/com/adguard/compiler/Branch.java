package com.adguard.compiler;

/**
 * Created by a.tropnikov
 * 18.04.17
 */
public enum Branch {

    DEV("dev"), BETA("beta"), RELEASE("release");

    private final String name;

    Branch(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public static Branch fromName(String name) {
        for (Branch branch : values()) {
            if (branch.name.equals(name)) {
                return branch;
            }
        }
        throw new IllegalArgumentException("Unknown branch " + name);
    }
}
