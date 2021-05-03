/*
 * Copyright (c) Minh Loi.
 *
 * This file is part of Ulangi which is released under GPL v3.0.
 * See LICENSE or go to https://www.gnu.org/licenses/gpl-3.0.txt
 */

import {
  ButtonSize,
  ContactUsFormType,
  LightBoxState,
  ScreenName,
  Theme,
} from '@ulangi/ulangi-common/enums';
import { ButtonStyles, ThemeSettings } from '@ulangi/ulangi-common/interfaces';
import {
  ObservableCarouselMessage,
  ObservableLightBox,
  ObservableMoreScreen,
  ObservableThemeStore,
  ObservableUserStore,
  Observer,
} from '@ulangi/ulangi-observable';
import { boundClass } from 'autobind-decorator';
import { runInAction } from 'mobx';
import { Platform } from 'react-native';

import { config } from '../../constants/config';
import { env } from '../../constants/env';
import { MoreScreenIds } from '../../constants/ids/MoreScreenIds';
import { RootScreenDelegate } from '../../delegates/root/RootScreenDelegate';
import { bottomTabsStyles } from '../../styles/BottomTabsStyles';
import { fullRoundedButtonStyles } from '../../styles/FullRoundedButtonStyles';
import { AutoArchiveSettingsDelegate } from '../auto-archive/AutoArchiveSettingsDelegate';
import { DialogDelegate } from '../dialog/DialogDelegate';
import { LinkingDelegate } from '../linking/LinkingDelegate';
import { NavigatorDelegate } from '../navigator/NavigatorDelegate';
import { InAppRatingDelegate } from '../rating/InAppRatingDelegate';
import { ReminderSettingsDelegate } from '../reminder/ReminderSettingsDelegate';
import { ThemeSettingsDelegate } from '../theme/ThemeSettingsDelegate';

@boundClass
export class MoreScreenDelegate {
  private observer: Observer;
  private userStore: ObservableUserStore;
  private themeStore: ObservableThemeStore;
  private observableLightBox: ObservableLightBox;
  private observableScreen: ObservableMoreScreen;
  private rootScreenDelegate: RootScreenDelegate;
  private inAppRatingDelegate: InAppRatingDelegate;
  private autoArchiveSettingsDelegate: AutoArchiveSettingsDelegate;
  private reminderSettingsDelegate: ReminderSettingsDelegate;
  private themeSettingsDelegate: ThemeSettingsDelegate;
  private linkingDelegate: LinkingDelegate;
  private dialogDelegate: DialogDelegate;
  private navigatorDelegate: NavigatorDelegate;

  public constructor(
    observer: Observer,
    userStore: ObservableUserStore,
    themeStore: ObservableThemeStore,
    observableLightBox: ObservableLightBox,
    observableScreen: ObservableMoreScreen,
    rootScreenDelegate: RootScreenDelegate,
    inAppRatingDelegate: InAppRatingDelegate,
    autoArchiveSettingsDelegate: AutoArchiveSettingsDelegate,
    reminderSettingsDelegate: ReminderSettingsDelegate,
    themeSettingsDelegate: ThemeSettingsDelegate,
    linkingDelegate: LinkingDelegate,
    dialogDelegate: DialogDelegate,
    navigatorDelegate: NavigatorDelegate,
  ) {
    this.observer = observer;
    this.userStore = userStore;
    this.themeStore = themeStore;
    this.observableScreen = observableScreen;
    this.observableLightBox = observableLightBox;
    this.rootScreenDelegate = rootScreenDelegate;
    this.inAppRatingDelegate = inAppRatingDelegate;
    this.autoArchiveSettingsDelegate = autoArchiveSettingsDelegate;
    this.reminderSettingsDelegate = reminderSettingsDelegate;
    this.themeSettingsDelegate = themeSettingsDelegate;
    this.linkingDelegate = linkingDelegate;
    this.dialogDelegate = dialogDelegate;
    this.navigatorDelegate = navigatorDelegate;
  }

  public autoUpdateBottomTabs(): void {
    this.observer.reaction(
      (): Theme => this.themeStore.theme,
      (theme): void => {
        this.rootScreenDelegate.mergeBottomTabsOptions({
          backgroundColor: bottomTabsStyles.getBackgroundColor(theme),
        });
      },
    );
  }

  public autoUpdateCarouselMessages(): void {
    this.observer.reaction(
      (): {
        isGuest: boolean;
        isPremium: boolean;
        isReminderActive: boolean;
      } => {
        return {
          isGuest: this.userStore.existingCurrentUser.email.endsWith(
            config.general.guestEmailDomain,
          ),
          isPremium: this.userStore.existingCurrentUser.isPremium,
          isReminderActive: this.isReminderActive(),
        };
      },
      ({ isGuest }): void => {
        runInAction(
          (): void => {
            this.observableScreen.messages.clear();
            if (isGuest) {
              this.observableScreen.messages.push(
                new ObservableCarouselMessage(
                  'set-up-account',
                  'IMPORANT',
                  'Set up an account now to back up your data.',
                  '#5E35B1',
                  'Set up account',
                  '#4527A0',
                  this.navigateToSetUpAccountScreen,
                ),
              );
            }

            this.observableScreen.messages.push(
              new ObservableCarouselMessage(
                'sync-with-google-sheets',
                'DID YOU KNOW',
                'You can import, export and manage your data via a spreadsheet document.',
                '#43A047',
                'Sync with Google Sheets',
                '#2E7D32',
                this.navigateToGoogleSheetsAddOnScreen,
              ),
            );

            this.observableScreen.messages.push(
              new ObservableCarouselMessage(
                'midterm-app',
                'DID YOU KNOW',
                'Ulangi is now completely free, open-source and sponsored by Midterm.',
                '#1E88E5',
                'Learn more about Midterm',
                '#1565C0',
                this.goToMidterm,
              ),
            );
          },
        );
      },
      {
        fireImmediately: true,
      },
    );
  }

  public rateThisApp(): void {
    this.inAppRatingDelegate.showInAppRating(false);
  }

  public logOut(): void {
    const message =
      this.userStore.existingCurrentUser.email.endsWith(
        config.general.guestEmailDomain,
      ) === true
        ? 'Warning: You have not set up this account yet. If you log out, you will not be able to access it again. Are you sure you want to log out?'
        : 'Are you sure you want to log out?';
    this.dialogDelegate.show({
      message,
      closeOnTouchOutside: true,
      buttonList: [
        {
          testID: MoreScreenIds.NO_BTN,
          text: 'NO',
          onPress: (): void => {
            this.navigatorDelegate.dismissLightBox();
          },
          styles: (theme, layout): ButtonStyles =>
            fullRoundedButtonStyles.getSolidGreyBackgroundStyles(
              ButtonSize.SMALL,
              theme,
              layout,
            ),
        },
        {
          testID: MoreScreenIds.YES_BTN,
          text: 'YES',
          onPress: (): void => {
            this.navigatorDelegate.dismissLightBox();
            this.observer.when(
              (): boolean =>
                this.observableLightBox.state === LightBoxState.UNMOUNTED,
              (): void =>
                this.rootScreenDelegate.setRootToSingleScreen(
                  ScreenName.SIGN_OUT_SCREEN,
                ),
            );
          },
          styles: (theme, layout): ButtonStyles =>
            fullRoundedButtonStyles.getSolidGreyBackgroundStyles(
              ButtonSize.SMALL,
              theme,
              layout,
            ),
        },
      ],
    });
  }

  public isAutoArchiveEnabled(): boolean {
    return this.autoArchiveSettingsDelegate.getCurrentSettings()
      .autoArchiveEnabled;
  }

  public isReminderActive(): boolean {
    return this.reminderSettingsDelegate.isReminderActive();
  }

  public getThemeSettings(): ThemeSettings {
    return this.themeSettingsDelegate.getCurrentSettings();
  }

  public getReadableReminderTime(): string {
    return this.reminderSettingsDelegate.getReadableTime();
  }

  public goToMidterm(): void {
    this.linkingDelegate.openLink('https://midterm.app');
  }

  public goToTwitter(): void {
    this.linkingDelegate.openLink(config.links.twitter);
  }

  public goToInstagram(): void {
    this.linkingDelegate.openLink(config.links.instagram);
  }

  public goToReddit(): void {
    this.linkingDelegate.openLink(config.links.reddit);
  }

  public goToGitHub(): void {
    this.linkingDelegate.openLink(config.links.github);
  }

  public navigateToSetUpAccountScreen(): void {
    this.navigatorDelegate.push(ScreenName.SET_UP_ACCOUNT_SCREEN, {});
  }

  public navigateToSecurityScreen(): void {
    this.navigatorDelegate.push(ScreenName.SECURITY_SCREEN, {});
  }

  public navigateToSetManagementScreen(): void {
    this.navigatorDelegate.push(ScreenName.SET_MANAGEMENT_SCREEN, {});
  }

  public navigateToSynchronizerScreen(): void {
    this.navigatorDelegate.push(ScreenName.SYNCHRONIZER_SCREEN, {});
  }

  public navigateToReminderScreen(): void {
    this.navigatorDelegate.push(ScreenName.REMINDER_SCREEN, {});
  }

  public navigateToThemeScreen(): void {
    this.navigatorDelegate.push(ScreenName.THEME_SCREEN, {});
  }

  public navigateToAutoArchiveScreen(): void {
    this.navigatorDelegate.push(ScreenName.AUTO_ARCHIVE_SCREEN, {});
  }

  public navigateToGoogleSheetsAddOnScreen(): void {
    this.navigatorDelegate.push(ScreenName.GOOGLE_SHEETS_ADD_ON_SCREEN, {});
  }

  public navigateToWhatsNewScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.BROWSER_SCREEN, {
      link: env.SERVER_URL + '/whats-new',
      screenTitle: "What's New",
    });
  }

  public navigateToFollowUsScreen(): void {
    this.navigatorDelegate.push(ScreenName.FOLLOW_US_SCREEN, {});
  }

  public navigateToQuickTutorialScreen(): void {
    this.navigatorDelegate.push(ScreenName.QUICK_TUTORIAL_SCREEN, {});
  }

  public navigateToFeedbackScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.CONTACT_US_SCREEN, {
      initialFormType: ContactUsFormType.FEEDBACK,
    });
  }

  public navigateToFeatureRequestScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.CONTACT_US_SCREEN, {
      initialFormType: ContactUsFormType.FEATURE_REQUEST,
    });
  }

  public navigateToReportABugScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.CONTACT_US_SCREEN, {
      initialFormType: ContactUsFormType.REPORT_A_BUG,
    });
  }

  public navigateToContactSupportScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.CONTACT_US_SCREEN, {
      initialFormType: ContactUsFormType.CONTACT_SUPPORT,
    });
  }

  public navigateToTermsOfServiceScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.BROWSER_SCREEN, {
      link: env.SERVER_URL + '/terms-of-service',
      screenTitle: 'Terms of Service',
    });
  }

  public navigateToPrivacyPolicyScreen(): void {
    this.navigatorDelegate.showModal(ScreenName.BROWSER_SCREEN, {
      link: env.SERVER_URL + '/privacy-policy',
      screenTitle: 'Privacy Policy',
    });
  }

  public navigateToEventLogsScreen(): void {
    this.navigatorDelegate.push(ScreenName.EVENT_LOGS_SCREEN, {});
  }

  public showLink(link: string, screenTitle: string): void {
    this.navigatorDelegate.showModal(ScreenName.BROWSER_SCREEN, {
      link,
      screenTitle,
    });
  }

  public setRating(rating: number): void {
    if (this.inAppRatingDelegate.isRatingValid(rating)) {
      this.inAppRatingDelegate.updateUserRating(rating);

      if (rating >= 1 && rating <= 4) {
        this.navigateToFeedbackScreen();
      } else if (rating === 5) {
        this.inAppRatingDelegate.showInAppRating(Platform.OS === 'android');
      }
    }
  }
}
