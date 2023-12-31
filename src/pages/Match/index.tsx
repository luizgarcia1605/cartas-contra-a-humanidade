import { useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Tag } from '@blueprintjs/core';

import { useAuth } from '@/contexts/AuthContext';
import { SomeLoading } from '@/components/SomeLoading';
import { Card } from '@/components/Card';
import { GoBack } from '@/components/GoBack';
import { useBoolean } from '@/hooks/useBoolean';
import { AppToaster } from '@/components/Toast';
import { finishMatch } from '@/services/matches';
import { getFirstString } from '@/utils/getFirstString';

import { useSetupMatch } from './useSetupMatch';
import { CardsPlayedList } from './CardsPlayedList';
import { UsersListHandles } from './UsersList';
import { CardsToPlay } from './CardsToPlay';
import { Menu } from './Menu';

import styles from './styles.module.scss';

export function Match(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { isLoading, match, nextRound, loadingNext, reload, isFirstTime } =
    useSetupMatch(id || '');

  const menuRef = useRef<UsersListHandles>(null);

  const [alertIsOpen, openAlert, closeAlert] = useBoolean(false);
  const [finishing, setFinishingTrue, setFinishingFalse] = useBoolean(false);

  const round = match?.rounds?.length;
  const matchStarted = round > 0;
  const isOwner = match?.owner?.uid === user.uid;

  const userAlreadyPlayed = match?.rounds?.[0]?.usersWhoPlayed.find(
    (otherUser) => otherUser.user.uid === user.uid
  );

  function openDrawer(): void {
    menuRef.current?.openDrawer();
  }

  async function handleFinishMatch(): Promise<void> {
    try {
      setFinishingTrue();
      await finishMatch(match.id);
      reload();
    } catch {
      AppToaster.show({
        intent: 'danger',
        icon: 'error',
        message: 'Aconteceu um erro ao tentar finalizar partida!',
      });
    } finally {
      setFinishingFalse();
    }
  }

  return (
    <div className={styles.container}>
      <SomeLoading
        loading={isLoading || loadingNext}
        message={
          isLoading ? 'Carregando partida...' : 'Carregando próximo round...'
        }
      />

      {!isLoading && !loadingNext && (
        <>
          {matchStarted && (
            <div className={styles.question}>
              <Card
                {...match.rounds[0].question}
                animationDelay={loadingNext ? '0s' : '0.5s'}
                animationType={loadingNext ? 'revert' : 'auto'}
              />
            </div>
          )}

          <div className={styles.goBack}>
            <GoBack />
          </div>

          {matchStarted && !userAlreadyPlayed && (
            <CardsToPlay match={match} isFirstTime={isFirstTime} />
          )}

          {matchStarted && <CardsPlayedList match={match} />}

          <Menu ref={menuRef} match={match} />

          <Button
            intent="success"
            className={styles.menu}
            onClick={openDrawer}
            icon="user"
          />

          {matchStarted && (
            <Tag
              large
              intent="primary"
              round
              rightIcon="flag"
              className={styles.rounds}
            >
              {round}° Round
            </Tag>
          )}

          {!matchStarted && (
            <Card
              message={
                isOwner
                  ? 'Inicie a partida a qualquer momento.'
                  : `Esperando <strong>${getFirstString(
                      match.owner.displayName
                    )}</strong> iniciar a partida!`
              }
              className={styles.cardRotating}
              type="WHITE"
              animationType="rotating"
              animationDelay="0s"
            />
          )}

          {isOwner && (
            <>
              <div className={styles.buttonsToManage}>
                {matchStarted && (
                  <div className={styles.close}>
                    <Button
                      intent="danger"
                      onClick={openAlert}
                      large
                      rightIcon="cross"
                      loading={loadingNext}
                      text="Finalizar partida"
                    />
                  </div>
                )}

                <div
                  className={`${styles.manageButton} ${
                    round === 0 ? styles.startButton : ''
                  }`}
                >
                  <Button
                    intent={round === 0 ? 'success' : 'primary'}
                    onClick={nextRound}
                    large
                    rightIcon={round === 0 ? 'play' : 'direction-right'}
                    loading={loadingNext}
                  >
                    {round === 0 ? 'Iniciar partida' : 'Próximo round'}
                  </Button>
                </div>
              </div>
              <Alert
                isOpen={alertIsOpen}
                onClose={closeAlert}
                intent="danger"
                cancelButtonText="Cancelar"
                confirmButtonText="Finalizar"
                loading={finishing}
                onConfirm={handleFinishMatch}
              >
                <p>Você tem certeza que deseja finalizar a partida?</p>
              </Alert>
            </>
          )}
        </>
      )}
    </div>
  );
}
