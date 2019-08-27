Please fill in this template

-   [ ] Use a meaningful title for the pull request
-   [ ] Optimise SVGs before you raise a pull request

Select one of these, and delete the others:

Adding an icon: `this will be marked as a patch`

-   [ ] Give the icon a meaningful name, preferably namespaced eg,
        car-windscreen rather than just windscreen.
-   [ ] Add svg to the icons/ folder, and raise the pull request

If moving, renaming or deleting an icon: `this will be marked as a minor`

-   [ ] Give the icon a meaningful name, preferably namespaced eg,
        car-windscreen rather than just windscreen.
-   [ ] Describe why the icon was renamed, moved or deleted.
-   [ ] If you are renaming an icon, and also adding an icon with the same name
        as the old renamed file. Please raise both of those in a single pull
        request, and annotate the pull request as a breaking change.
-   [ ] With an all caps "BREAKING CHANGE" at the bottom of the pull request,
        describe a migration path for this.

```
BREAKING CHANGE:
IconA is now IconB
IconC no longer exists, please use IconX instead
```

> Note, you don't need to tell us that IconA no longer exists, because of the
> rename.

---

Big icon changes will be marked as a major, but will probably be done manually
in 1 pull request, and versioned accordingly.
